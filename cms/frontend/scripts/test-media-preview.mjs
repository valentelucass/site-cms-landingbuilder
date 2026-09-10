import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";

export async function testMediaPreview({ cdp, evaluate, until, screenshot, mediaFixture, selectPreviewFixture }) {
  const overlay = '[data-media-preview-dialog="true"]';
  const dialog = `${overlay} [role=dialog]`;
  const trigger = '[aria-label="Ampliar Logo de teste"]';
  const close = `${overlay} [aria-label="Fechar preview"]`;
  const query = (selector) => `document.querySelector(${JSON.stringify(selector)})`;
  const scrollTop = await evaluate(`${query('[data-admin-scroll]')}.scrollTop`);
  const originalOverflow = await evaluate(`${query('[data-admin-scroll]')}.style.overflow`);
  async function open() {
    await evaluate(`${query(trigger)}.focus({preventScroll:true}); ${query(trigger)}.click()`);
    await until(() => evaluate(`Boolean(${query(dialog)}) && document.activeElement === ${query(close)}`), "abrir ampliação e focar Fechar");
  }
  async function ready() {
    await until(() => evaluate(`${query(`${dialog} img`)}?.naturalWidth > 0 && ${query(`${dialog} [aria-busy]`)}?.getAttribute('aria-busy') === 'false'`), "carregar mídia ampliada");
  }
  async function assertBounds(label) {
    const geometry = await evaluate(`(() => {
      const overlay = ${query(overlay)}, dialog = ${query(dialog)}, image = dialog.querySelector('img'), close = ${query(close)};
      const bounds = element => { const r = element.getBoundingClientRect(); return { x:r.x, y:r.y, right:r.right, bottom:r.bottom, width:r.width, height:r.height }; };
      return { portal: overlay.parentElement.dataset.adminShell, dialog:bounds(dialog), image:image ? bounds(image) : null,
        close:bounds(close), footer:bounds(dialog.lastElementChild), viewport:{width:innerWidth,height:innerHeight},
        cropped: dialog.scrollHeight > dialog.clientHeight || dialog.scrollWidth > dialog.clientWidth,
        fit:image ? getComputedStyle(image).objectFit : null,
        front: document.elementFromPoint(close.getBoundingClientRect().x + 10, close.getBoundingClientRect().y + 10)?.closest('button') === close,
        lock:${query('[data-admin-scroll]')}.style.overflow };
    })()`);
    assert.equal(geometry.portal, "true", `${label}: preview permaneceu dentro do card.`);
    for (const box of [geometry.dialog, geometry.image, geometry.close, geometry.footer].filter(Boolean)) {
      assert(box.x >= 0 && box.y >= 0 && box.right <= geometry.viewport.width && box.bottom <= geometry.viewport.height && box.height > 0, `${label}: ${JSON.stringify(geometry)}`);
    }
    if (geometry.image) {
      assert.equal(geometry.fit, "contain");
      assert(geometry.image.y >= geometry.close.bottom && geometry.image.bottom <= geometry.footer.y, `${label}: a mídia sobrepôs cabeçalho/rodapé.`);
    }
    assert(!geometry.cropped && geometry.front, `${label}: recorte ou botão encoberto.`);
    assert.equal(geometry.lock, "hidden");
  }
  async function closed() {
    await until(() => evaluate(`!${query(overlay)}`), "fechar ampliação");
    assert(await evaluate(`document.activeElement === ${query(trigger)}`), "O foco não voltou a Ampliar.");
    assert.equal(await evaluate(`${query('[data-admin-scroll]')}.style.overflow`), originalOverflow);
  }
  async function escape() {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await closed();
  }

  await cdp("Network.enable");
  await cdp("Network.setCacheDisabled", { cacheDisabled: true });
  await open();
  await ready();
  await assertBounds("desktop retrato");
  assert.equal(await evaluate(`${query(`${dialog} img`)}.naturalHeight`), 2400);
  await screenshot("preview-desktop");
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  assert(await evaluate(`document.activeElement === ${query(close)}`), "Tab saiu do modal.");
  await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 });
  assert(await evaluate(`document.activeElement === ${query(close)}`), "Shift+Tab saiu do modal.");
  await escape();
  assert(Math.abs(await evaluate(`${query('[data-admin-scroll]')}.scrollTop`) - scrollTop) < 2, "Fechar alterou a rolagem do formulário.");

  for (const viewport of [{ width: 900, height: 360, mobile: false }, { width: 390, height: 844, mobile: true }, { width: 320, height: 568, mobile: true }]) {
    await cdp("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: 1 });
    await delay(600);
    await open();
    await ready();
    await assertBounds(`${viewport.width}x${viewport.height}`);
    await screenshot(`preview-${viewport.width}x${viewport.height}`);
    await evaluate(`${query(close)}.click()`);
    await closed();
  }

  await cdp("Emulation.setDeviceMetricsOverride", { width: 1920, height: 900, deviceScaleFactor: 1, mobile: false });
  await delay(600);
  await evaluate(`${query('[aria-label="Ativar modo claro"]')}.click()`);
  mediaFixture.width = 3200;
  mediaFixture.height = 900;
  mediaFixture.paused = true;
  // URLs diferentes evitam reutilizar a imagem já decodificada da miniatura.
  await selectPreviewFixture(`/uploads/preview-${"long-name-".repeat(20)}.png`);
  await open();
  await until(() => evaluate(`Boolean(${query(`${dialog} [role=status]`)})`), "carregamento visível");
  await assertBounds("carregando");
  mediaFixture.paused = false;
  await ready();
  assert.equal(await evaluate(`${query(`${dialog} img`)}.naturalWidth`), 3200);
  await assertBounds("paisagem no tema claro");
  await screenshot("preview-light-landscape");
  await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: 250, y: 5, button: "left", clickCount: 1 });
  await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: 250, y: 5, button: "left", clickCount: 1 });
  await closed();

  mediaFixture.fail = true;
  await selectPreviewFixture("/uploads/preview-retry.png");
  await open();
  await until(() => evaluate(`Boolean(${query(`${dialog} [role=alert]`)})`), "falha de mídia visível");
  await assertBounds("erro de mídia");
  await screenshot("preview-error");
  mediaFixture.fail = false;
  mediaFixture.width = 1800;
  mediaFixture.height = 1800;
  await evaluate(`${query(`${dialog} [role=alert] button`)}.click()`);
  await ready();
  assert.equal(await evaluate(`${query(`${dialog} img`)}.naturalWidth`), 1800);
  await assertBounds("recuperação com imagem quadrada");
  await escape();
  await evaluate(`${query('[aria-label="Ativar modo noturno"]')}.click()`);
  console.log("PASS: Ampliar em portal, imagem inteira (retrato/paisagem/quadrada), desktop/mobile/tela baixa, claro/escuro, loading/erro/retry, Fechar/Escape/fundo, foco contido e restaurado, rolagem preservada.");
}
