import type { CanvasScene } from "@/components/media/AnimatedCanvasScene";

type Point = [x: number, y: number, z: number];
type FaceColors = readonly [top: string, near: string, right: string];

const colors = {
  slab: ["#dae6f3", "#a6bdd8", "#8da9c8"],
  walls: ["#edf5fd", "#acc4de", "#bcd1e7"],
  roof: ["#f4f9ff", "#9db9d9", "#8ba8ca"],
  glass: ["#c7e5f5", "#739fc5", "#6390bb"],
  trailer: ["#f6faff", "#d3e1f0", "#afc7df"],
  truck: ["#5496ec", "#2b65bc", "#234c91"],
  steel: ["#7894b6", "#456182", "#344d6e"],
  graphite: ["#4a6180", "#2d4561", "#1e304a"],
  forklift: ["#ffcf71", "#e6a23c", "#bc7929"],
  pallet: ["#d6a36d", "#b78351", "#98683d"],
  carton: ["#f2ce9e", "#d8a475", "#ba855b"],
} satisfies Record<string, FaceColors>;

const truckY = -15;
const forkliftY = 56;
const parkedTruckX = -52;
const forkliftHomeX = 92;
const pickupX = 48;
const dropoffX = -6;
const palletOffset = 24;
const liftHeight = 11;

function easeBetween(progress: number, start: number, end: number) {
  const amount = Math.min(1, Math.max(0, (progress - start) / (end - start)));
  return amount * amount * (3 - 2 * amount);
}

function dockFrame(progress: number) {
  const arrive = easeBetween(progress, 0, 0.18);
  const leave = easeBetween(progress, 0.7, 0.97);
  const approach = easeBetween(progress, 0.12, 0.25);
  const transfer = easeBetween(progress, 0.31, 0.48);
  const clearPallet = easeBetween(progress, 0.54, 0.6) - easeBetween(progress, 0.6, 0.67);
  const returnLoad = easeBetween(progress, 0.73, 0.86);
  const retreat = easeBetween(progress, 0.92, 1);
  const forkHeight =
    liftHeight * (
      easeBetween(progress, 0.25, 0.31) - easeBetween(progress, 0.48, 0.54) +
      easeBetween(progress, 0.67, 0.73) - easeBetween(progress, 0.86, 0.92)
    );
  const loadX = pickupX + (dropoffX - pickupX) * (transfer - returnLoad);

  return {
    truckX: 104 + (parkedTruckX - 104) * (arrive - leave),
    door: easeBetween(progress, 0.15, 0.26) - easeBetween(progress, 0.69, 0.83),
    forkliftX: loadX + 24 * clearPallet + (forkliftHomeX - pickupX) * (1 - approach + retreat),
    palletX: loadX - palletOffset,
    forkHeight,
  };
}

// The camera looks from positive x/y/z. All faces, markings and attachments
// use this projection so changing position does not change their perspective.
function drawing(context: CanvasRenderingContext2D, offsetX = 0, offsetY = 0) {
  function project([x, y, z]: Point) {
    const worldX = x + offsetX;
    const worldY = y + offsetY;
    return [264 + (worldX - worldY) * 0.89, 206 + (worldX + worldY) * 0.44 - z] as const;
  }

  function path(points: Point[]) {
    context.beginPath();
    for (const [index, point] of points.entries()) {
      const [x, y] = project(point);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
  }

  function polygon(points: Point[], color: string) {
    path(points);
    context.closePath();
    context.fillStyle = color;
    context.fill();
  }

  function line(points: Point[], color: string, width = 1, dash: number[] = []) {
    path(points);
    context.lineWidth = width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.setLineDash(dash);
    context.strokeStyle = color;
    context.stroke();
  }

  function top(x: number, y: number, width: number, depth: number, z: number, color: string) {
    polygon([[x, y, z], [x + width, y, z], [x + width, y + depth, z], [x, y + depth, z]], color);
  }

  function sideX(x: number, y: number, depth: number, z: number, height: number, color: string) {
    polygon([[x, y, z], [x, y + depth, z], [x, y + depth, z + height], [x, y, z + height]], color);
  }

  function sideY(x: number, y: number, width: number, z: number, height: number, color: string) {
    polygon([[x, y, z], [x + width, y, z], [x + width, y, z + height], [x, y, z + height]], color);
  }

  function box(x: number, y: number, width: number, depth: number, z: number, height: number, faces: FaceColors) {
    sideY(x, y + depth, width, z, height, faces[1]);
    sideX(x + width, y, depth, z, height, faces[2]);
    top(x, y, width, depth, z + height, faces[0]);
  }

  function wheel(x: number, y: number, radius: number) {
    function disc(size: number, color: string) {
      const ring = Array.from({ length: 18 }, (_, index): Point => {
        const angle = index * Math.PI / 9;
        return [x + Math.cos(angle) * size, y, radius + Math.sin(angle) * size];
      });
      polygon(ring, color);
    }
    disc(radius, "#192a40");
    disc(radius * 0.61, "#3c536c");
    disc(radius * 0.33, "#b1c6dc");
  }

  function lamp(point: Point, color: string) {
    const [x, y] = project(point);
    context.beginPath();
    context.arc(x, y, 2.45, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  }

  function label(value: string, point: Point) {
    const [x, y] = project(point);
    context.font = "bold 12px system-ui, sans-serif";
    context.fillStyle = "#2d5278";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(value, x, y);
  }

  function shadow(point: Point, width: number, height: number, opacity: number) {
    const [x, y] = project(point);
    context.save();
    context.translate(x, y);
    context.scale(width, height);
    const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, `rgba(23, 53, 96, ${opacity})`);
    gradient.addColorStop(1, "rgba(23, 53, 96, 0)");
    context.fillStyle = gradient;
    context.fillRect(-1, -1, 2, 2);
    context.restore();
  }

  return { top, sideX, sideY, box, line, wheel, lamp, label, shadow };
}

type Drawing = ReturnType<typeof drawing>;

function drawYard(art: Drawing) {
  art.shadow([29, 21, -8], 238, 113, 0.22);
  art.box(-148, -106, 352, 214, -7, 7, colors.slab);
  art.top(-61, -98, 258, 196, 0, "#c1d4e8");
  art.top(-61, -26, 265, 53, 0, "#7897b9");
  art.top(-58, 37, 250, 40, 0, "#d0dfed");
  art.line([[-53, 0, 0], [200, 0, 0]], "#eff6ffd4", 1.7, [9, 7]);

  for (const y of [-98, -28, 29, 81]) {
    art.line([[-56, y, 0], [192, y, 0]], "#eff7ffc9", 1);
  }
  for (const y of [-72, -46, 43, 72]) {
    art.line([[-54, y, 0], [-7, y, 0]], "#f8fcffe6", 1.5);
  }

  // The guides mark the pallet's staging bays, clear of the dock wall.
  art.line([[-36, 43, 0], [-36, 69, 0], [-9, 69, 0]], "#a38454", 1.4, [4, 4]);
  art.line([[-29, 43, 0], [-9, 43, 0]], "#a38454", 1.4, [4, 4]);
  art.line([[20, 43, 0], [20, 69, 0], [45, 69, 0]], "#a38454", 1.4, [4, 4]);
  art.line([[26, 43, 0], [45, 43, 0]], "#a38454", 1.4, [4, 4]);
  art.line([[-142, 103, 0], [198, 103, 0], [198, 30, 0]], "#edf5fd", 1.3);
}

function drawWarehouse(art: Drawing, opening: number) {
  art.box(-141, -96, 83, 190, 0, 72, colors.walls);
  art.sideY(-141, 94.1, 83, 0, 8, "#91aece");
  for (const x of [-131, -112, -93, -74]) {
    art.line([[x, 94.2, 9], [x, 94.2, 69]], "#84a5c686");
  }

  art.box(-145, -100, 91, 198, 72, 5, colors.roof);
  art.line([[-138, -94, 77], [-60, -94, 77], [-60, 91, 77], [-138, 91, 77], [-138, -94, 77]], "#c2d5ea", 1.15);
  for (const y of [-77, -26, 25]) {
    art.box(-124, y, 24, 33, 77, 5, colors.glass);
    art.line([[-112, y, 82.1], [-112, y + 33, 82.1]], "#f1f8ff", 1.3);
    art.line([[-124, y + 16.5, 82.1], [-100, y + 16.5, 82.1]], "#f1f8ff", 1.3);
  }

  for (const [index, y] of [-85, -22, 41].entries()) {
    const amount = index === 1 ? opening : 0;
    art.sideX(-57.9, y, 44, 0.2, 50, "#849fbe");
    art.sideX(-57.8, y + 2, 40, 1, 47, "#283f60");
    art.sideX(-57.7, y + 4, 36, 3, 42, "#314c71");
    const bottom = 2 + amount * 43;
    art.sideX(-57.6, y + 2, 40, bottom, 48 - bottom, "#9ab2ca");
    for (let z = bottom + 5; z < 47; z += 6) {
      art.line([[-57.5, y + 2, z], [-57.5, y + 42, z]], "#647f9f", 0.9);
    }
    art.box(-58, y - 2, 2, 3, 1, 11, colors.steel);
    art.box(-58, y + 43, 2, 3, 1, 11, colors.steel);
    art.label(`0${index + 3}`, [-57.5, y + 22, 59]);
    art.lamp([-57.4, y + 2, 55], amount > 0.6 ? "#00839d" : "#d58d31");
  }
}

function drawTruck(art: Drawing) {
  const axles = [10, 22, 72, 86];
  for (const x of axles) art.wheel(x, 0, 6.1);

  art.box(2, 1, 92, 28, 7, 4, colors.graphite);
  art.box(0, 0, 64, 30, 11, 25, colors.trailer);
  art.sideY(2, 30.1, 60, 12, 2.5, "#6d93c3");
  for (let x = 6; x < 64; x += 7) {
    art.line([[x, 30.1, 16], [x, 30.1, 33]], "#9ab6d0", 0.75);
  }
  art.line([[2, 1, 36.1], [62, 1, 36.1], [62, 29, 36.1]], "#fff", 1.25);
  art.box(67, 1, 29, 28, 10, 16, colors.truck);
  art.box(69, 1, 22, 28, 26, 7, colors.truck);
  art.sideY(73, 29.1, 15, 24, 7, "#233e61");
  art.sideX(91.1, 4, 22, 26, 5, "#27476d");
  art.sideX(96.1, 5, 20, 12, 4, "#203c64");
  art.sideX(96.2, 23, 4, 16, 2.5, "#f7e3a1");
  art.sideX(96.2, 4, 4, 16, 2.5, "#f7e3a1");
  art.line([[73, 29.2, 22], [88, 29.2, 22]], "#8cc2ef", 1);

  for (const x of axles) art.wheel(x, 30.2, 6.1);
}

function drawPallet(art: Drawing, z: number) {
  // The tines run between the three wooden runners, just below the deck.
  for (const y of [-8, -1.3, 6]) {
    art.box(0, y, 18, 2, z, 3, colors.pallet);
  }
  art.box(0, -8, 18, 16, z + 3, 2, colors.pallet);
  art.box(1, -7, 16, 14, z + 5, 13, colors.carton);
  art.top(8, -7, 2, 14, z + 18.1, "#f9e3c1");
  art.sideY(8, 7.1, 2, z + 5, 13, "#e4bc8d");
  art.sideY(12, 7.1, 3, z + 9, 3.5, "#faf2df");
}

function drawForklift(art: Drawing, z: number, drawLoad: () => void) {
  art.wheel(3, -11, 6.8);
  art.wheel(23, -11, 5.4);
  art.box(-4, -8, 3, 2, 4, 34, colors.graphite);
  art.box(6, -9, 2.6, 2.6, 11, 23, colors.graphite);
  art.box(23, -9, 2.6, 2.6, 14, 20, colors.graphite);

  for (const y of [-5, 3]) art.box(-palletOffset, y, 20, 2, z + 1, 2, colors.steel);
  drawLoad();

  art.box(-1, -10, 29, 20, 6, 7, colors.forklift);
  art.box(17, -10, 12, 20, 13, 5, colors.forklift);
  art.box(9, -4, 8, 8, 13, 3.4, colors.graphite);
  art.box(14, -4, 3, 8, 16.4, 5, colors.graphite);
  art.sideY(16, 10.1, 9, 10, 2, "#a46325");

  art.box(6, 7, 2.6, 2.6, 11, 23, colors.graphite);
  art.box(23, 7, 2.6, 2.6, 14, 20, colors.graphite);
  art.box(5, -10, 22, 20, 34, 2.7, colors.forklift);
  art.line([[7, -8, 37], [24, -8, 37], [24, 7, 37]], "#ffe6a5", 1.2);
  art.box(-4, 6, 3, 2, 4, 34, colors.graphite);
  art.box(-4, -8, 3, 16, 35, 3, colors.graphite);
  art.box(-6, -8, 3, 16, z + 2, 4, colors.steel);
  art.wheel(3, 10.6, 6.8);
  art.wheel(23, 10.6, 5.4);
}

function drawDock(context: CanvasRenderingContext2D, progress: number) {
  const frame = dockFrame(progress);
  const yard = drawing(context);

  drawYard(yard);
  yard.shadow([frame.truckX + 46, 1, 0], 53, 16, 0.22);
  yard.shadow([frame.forkliftX + 11, forkliftY, 0], 23, 9, 0.28);
  yard.shadow([frame.palletX + 9, forkliftY, 0], 14, 7, 0.2);

  // Where silhouettes overlap, the wall's x edge is behind the apron and the
  // forklift lane is nearer in y than the truck for the entire maneuver.
  drawWarehouse(yard, frame.door);
  yard.box(-51, -33, 4, 4, 0, 13, colors.forklift);
  drawTruck(drawing(context, frame.truckX, truckY));
  yard.box(-51, 30, 4, 4, 0, 13, colors.forklift);
  drawForklift(drawing(context, frame.forkliftX, forkliftY), frame.forkHeight, () => {
    drawPallet(drawing(context, frame.palletX, forkliftY), frame.forkHeight);
  });
  drawPallet(drawing(context, -40, 91), 0);
  yard.box(-36, 84, 12, 11, 18, 8, colors.carton);
  drawPallet(drawing(context, -15, 91), 0);
}

export const trackingDockScene: CanvasScene = {
  width: 574,
  height: 366,
  durationMs: 15400,
  still: 0.42,
  description: "Galpão com três docas. Um caminhão encosta na doca central enquanto uma empilhadeira leva um palete pela faixa da frente.",
  draw: drawDock,
};
