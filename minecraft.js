/* =========================================================
   MINECRAFT QUEST — a full voxel sandbox in the TeaQuest Arcade
   Pure WebGL · zero dependencies
   Structure:
     M = window.MC  (namespace)
     01 core       math, noise, blocks/items, textures, sound
     02 world      terrain, chunks, lighting, save/load
     03 render     WebGL, sky, fog, drawing
     04 game       player physics, interaction, mobs, tnt, time
     05 ui         menus, HUD, inventory, crafting, furnace, boot
   ======================================================== */
"use strict";

const MC = window.MC = {};

/* =========================================================
   01 · CORE
   ======================================================== */
MC.VERSION = "1.1.0";

MC.CH  = 16;          // chunk horizontal size
MC.WH  = 96;          // world height
MC.WATER = 47;        // sea level y (top of water body)


MC.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
MC.lerp  = (a, b, t) => a + (b - a) * t;


/* ---------- seeded rng & hashing ---------- */
function hash2i(x, z, seed) {
    let h = (x * 374761393 + z * 668265263 + seed * 1442695040888963407) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
}
MC.hash2i = hash2i;

function mulberry32(a) {
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
MC.mulberry32 = mulberry32;


/* ---------- value noise + fBm ---------- */
function vnoise2(x, z, seed) {
    const xi = Math.floor(x), zi = Math.floor(z);
    const xf = x - xi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf);
    const v = zf * zf * (3 - 2 * zf);
    const a = hash2i(xi, zi, seed) / 4294967296;
    const b = hash2i(xi + 1, zi, seed) / 4294967296;
    const c = hash2i(xi, zi + 1, seed) / 4294967296;
    const d = hash2i(xi + 1, zi + 1, seed) / 4294967296;
    return MC.lerp(MC.lerp(a, b, u), MC.lerp(c, d, u), v);
}
MC.vnoise2 = vnoise2;

function fbm2(x, z, seed, octaves, lac, gain) {
    octaves = octaves || 4; lac = lac || 2; gain = gain || 0.5;
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < octaves; i++) {
        sum += amp * vnoise2(x * freq, z * freq, seed + i * 101 + 7);
        norm += amp; amp *= gain; freq *= lac;
    }
    return sum / norm;
}
MC.fbm2 = fbm2;


/* =========================================================
   01 · BLOCKS & TILES
   ======================================================== */
const B_AIR=0, B_GRASS=1, B_DIRT=2, B_STONE=3, B_COBBLE=4, B_LOG=5,
      B_PLANKS=6, B_LEAVES=7, B_SAND=8, B_WATER=9, B_GLASS=10,
      B_BEDROCK=11, B_COAL=12, B_IRON=13, B_GOLD=14, B_DIAMOND=15,
      B_BRICK=16, B_TNT=17, B_OBSIDIAN=18, B_CRAFT=19, B_FURNACE=20,
      B_WOOL=21, B_GOLDBLOCK=22;

// item ids (everything a player can hold)
MC.I_BLOCK = new Map(); // buildable blocks
const I_COAL=50, I_IRON_INGOT=51, I_GOLD_INGOT=52, I_DIAMOND=53,
      I_STICK=54, I_WOOD_PICK=55, I_STONE_PICK=56, I_IRON_PICK=57,
      I_DIAMOND_PICK=58, I_AXE=59, I_SHOVEL=60, I_SWORD=61;

const BLOCKS = [
    { name:"Air", tile:"air", solid:false, shown:false, hardness:0 },
    { name:"Grass",       top:"grass_top",  side:"grass_side", bottom:"dirt",  hardness:0.6, tool:"shovel", drop:B_DIRT,  tile:"grass_side" },
    { name:"Dirt",        all:"dirt",       hardness:0.6, tool:"shovel", drop:B_DIRT,  tile:"dirt" },
    { name:"Stone",       all:"stone",      hardness:2.0, tool:"pick",   drop:B_COBBLE, mineTier:1, tile:"stone" },
    { name:"Cobblestone", all:"cobble",     hardness:2.0, tool:"pick",   drop:B_COBBLE, mineTier:1, tile:"cobble" },
    { name:"Oak Log",     side:"log_side",  top:"log_top", bottom:"log_top", hardness:2.0, tool:"axe", drop:B_LOG, tile:"log_side" },
    { name:"Planks",      all:"planks",     hardness:1.5, tool:"axe",   drop:B_PLANKS, tile:"planks" },
    { name:"Leaves",      all:"leaves",     hardness:0.3, transparent:true, drop:B_LEAVES, tile:"leaves" },
    { name:"Sand",        all:"sand",       hardness:0.6, tool:"shovel", drop:B_SAND, tile:"sand" },
    { name:"Water",       all:"water",      solid:false, transparent:true, water:true, drop:0, tile:"water" },
    { name:"Glass",       all:"glass",      hardness:0.3, transparent:true, drop:B_GLASS, tile:"glass" },
    { name:"Bedrock",     all:"bedrock",    hardness:-1,  mineTier:99, drop:0, tile:"bedrock" },
    { name:"Coal Ore",    all:"coal",       hardness:3.0, tool:"pick",   drop:I_COAL, mineTier:1, tile:"coal" },
    { name:"Iron Ore",    all:"iron",       hardness:3.0, tool:"pick",   drop:B_IRON, mineTier:2, tile:"iron" },
    { name:"Gold Ore",    all:"gold",       hardness:3.0, tool:"pick",   drop:B_GOLD, mineTier:3, tile:"gold" },
    { name:"Diamond Ore", all:"diamond",    hardness:3.0, tool:"pick",   drop:I_DIAMOND, mineTier:3, tile:"diamond" },
    { name:"Bricks",      all:"brick",      hardness:2.0, tool:"pick",   drop:B_BRICK, mineTier:1, tile:"brick" },
    { name:"TNT",         all:"tnt_side",   top:"tnt_top", bottom:"tnt_bottom", hardness:0, drop:0, tile:"tnt_side" },
    { name:"Obsidian",    all:"obsidian",   hardness:50,  tool:"pick",   drop:B_OBSIDIAN, mineTier:4, tile:"obsidian" },
    { name:"Crafting Table", side:"craft_side", top:"craft_top", bottom:"planks", hardness:2.5, tool:"axe", drop:B_CRAFT, tile:"craft_side" },
    { name:"Furnace",     side:"furnace_side", top:"furnace_top", bottom:"stone", hardness:3.5, tool:"pick", drop:B_FURNACE, mineTier:1, tile:"furnace_side" },
    { name:"Wool",        all:"wool_white",  hardness:0.8, tool:"sword", drop:B_WOOL, tile:"wool_white" },
    { name:"Gold Block",  all:"gold_block",  hardness:2.5, tool:"pick",  drop:B_GOLDBLOCK, mineTier:2, tile:"gold_block" },
];

// tile names that must exist in the atlas
const TILE_NAMES = [
    "grass_top","grass_side","dirt","stone","cobble","log_side","log_top",
    "leaves","planks","sand","water","glass","bedrock","coal","iron","gold",
    "diamond","brick","tnt_side","tnt_top","tnt_bottom","obsidian",
    "craft_side","craft_top","furnace_side","furnace_top",
    "wool_white","wool_silver","wool_brown","skin","cream","black","red",
    "gold_block","air","white"
];
MC.BLOCKS = BLOCKS;
MC.TILE_LIST = {};

MC.BLOCK = {}; // name -> id
BLOCKS.forEach((b, i) => { MC.BLOCK[b.name] = i; });


/* ---------- items registry ---------- */
MC.ITEMS = {};
MC.itemTexture = id => {
    if (id <= 22) return BLOCKS[id].tile;
    const map = {
        [I_COAL]:"coal", [I_IRON_INGOT]:"iron", [I_GOLD_INGOT]:"gold",
        [I_DIAMOND]:"diamond", [I_STICK]:"log_side",
        [I_WOOD_PICK]:"planks", [I_STONE_PICK]:"cobble", [I_IRON_PICK]:"iron",
        [I_DIAMOND_PICK]:"diamond", [I_AXE]:"brick", [I_SHOVEL]:"sand", [I_SWORD]:"wool_white"
    };
    return map[id] || "stone";
};
MC.itemName = id => {
    if (id <= 22) return BLOCKS[id].name;
    const map = {
        [I_COAL]:"Coal", [I_IRON_INGOT]:"Iron Ingot", [I_GOLD_INGOT]:"Gold Ingot",
        [I_DIAMOND]:"Diamond", [I_STICK]:"Stick", [I_WOOD_PICK]:"Wooden Pickaxe",
        [I_STONE_PICK]:"Stone Pickaxe", [I_IRON_PICK]:"Iron Pickaxe",
        [I_DIAMOND_PICK]:"Diamond Pickaxe", [I_AXE]:"Iron Axe",
        [I_SHOVEL]:"Iron Shovel", [I_SWORD]:"Iron Sword"
    };
    return map[id] || "Unknown";
};
MC.isTool = id => id >= I_WOOD_PICK;
MC.toolTier = id => id === I_WOOD_PICK ? 1 : id === I_STONE_PICK ? 2 : id === I_IRON_PICK ? 3 : id === I_DIAMOND_PICK ? 4 : 0;
MC.toolKind = id => {
    if (id === I_AXE) return "axe";
    if (id === I_SHOVEL) return "shovel";
    if (id === I_SWORD) return "sword";
    if (id >= I_WOOD_PICK && id <= I_DIAMOND_PICK) return "pick";
    return "hand";
};

// creative hotbar: the classic starter
MC.CREATIVE_HOTBAR = [B_GRASS, B_DIRT, B_STONE, B_COBBLE, B_LOG, B_PLANKS,
    B_SAND, B_GLASS, B_WOOL];


/* ---------- crafting recipes (3x3 patterns) ---------- */
// grid rows are strings of item ids; empty = 0/space
function r(...rows){ return rows; }
MC.CRAFTING = [
    { shape:r("5"),            out:B_PLANKS,    n:4,  name:"4 Planks (1 Log)" },
    { shape:r("6","6"),        out:I_STICK,     n:4,  name:"4 Sticks (2 Planks)" },
    { shape:r("6","6","6","6"),out:B_CRAFT,     n:1,  name:"Crafting Table (4 Planks)" },
    { shape:r("4","4","4","4","4","4","4","4"), out:B_FURNACE, n:1, name:"Furnace (8 Cobble)" },
    { shape:r("6","6","6","35","35"),           out:I_WOOD_PICK, n:1, name:"Wooden Pickaxe" },
    { shape:r("4","4","4","54","54"),           out:I_STONE_PICK, n:1, name:"Stone Pickaxe" },
    { shape:r("51","51","51","54","54"),        out:I_IRON_PICK, n:1, name:"Iron Pickaxe" },
    { shape:r("53","53","53","54","54"),        out:I_DIAMOND_PICK, n:1, name:"Diamond Pickaxe" },
    { shape:r("51","51","36","51","36"),        out:I_AXE, n:1, name:"Iron Axe" },
    { shape:r("51","36","36"),                  out:I_SHOVEL, n:1, name:"Iron Shovel" },
    { shape:r("51","51","36"),                  out:I_SWORD, n:1, name:"Iron Sword" },
    { shape:r("8","8","8","8","50","8","8","8"),out:B_TNT, n:1, name:"TNT (8 Sand + 1 Coal)" },
];
// smelting: input block id -> output item id
MC.SMELTING = {
    [B_IRON]:  I_IRON_INGOT,
    [B_GOLD]:  I_GOLD_INGOT,
    [B_SAND]:  B_GLASS,
    [B_LOG]:   I_COAL,
};
// fuel: item id -> units (one unit smelts one item)
MC.FUEL = {
    [B_COAL]: 8, [B_LOG]: 1.5, [B_PLANKS]: 1.5, [I_STICK]: 0.5,
};
MC.matchCrafting = grid => { // grid: array of arrays with item ids or 0
    const g = grid.length;
    for (const rec of MC.CRAFTING) {
        const h = rec.shape.length, w = rec.shape[0].length;
        if (h > g) continue;
        const dx = Math.floor((g - w) / 2), dy = Math.floor((g - h) / 2);
        if (dx < 0 || dy < 0) continue;
        let ok = true;
        for (let gy = 0; gy < g && ok; gy++) {
            for (let gx = 0; gx < g && ok; gx++) {
                const need = (gy >= dy && gy < dy + h && gx >= dx && gx < dx + w)
                    ? (rec.shape[gy - dy][gx - dx] | 0) : 0;
                const have = grid[gy][gx] | 0;
                if (need !== have) ok = false;
            }
        }
        if (ok) return rec;
    }
    return null;
};
MC.craftUses = (rec) => { // [{id,count}] consumed
    const counter = new Map();
    for (const row of rec.shape) {
        for (const ch of row) {
            const v = ch | 0;
            if (v > 0) counter.set(v, (counter.get(v) || 0) + 1);
        }
    }
    const out = []; counter.forEach((c, v) => out.push({ id: v, count: c }));
    return out;
};


/* =========================================================
   01 · PROCEDURAL TEXTURE ATLAS
   ======================================================== */
MC.TILE = {};
MC.buildAtlas = () => {
    const TS = 16, COLS = 16;
    const rows = Math.ceil(TILE_NAMES.length / COLS);
    const cv = document.createElement("canvas");
    cv.width = TS * COLS; cv.height = TS * rows;
    const ctx = cv.getContext("2d");

    const px = (x, y, r, g, b, a) => {
        ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${a===undefined?1:a})`;
        ctx.fillRect(x, y, 1, 1);
    };
    const fill = (x0, y0, TS, r, g, b, a) => {
        ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},${a===undefined?1:a})`;
        ctx.fillRect(x0, y0, TS, TS);
    };
    const rng = () => Math.random(); // alternate: seeded per tile for consistency

    const drawTile = (name, ox, oy) => {
        const seed = name.length * 131 + name.charCodeAt(0);
        const rnd = MC.mulberry32(seed);
        const noise = () => (rnd() - 0.5) * 1.0;

        const shade = (c, d) => MC.clamp(c + d, 0, 255);

        switch (name) {
            case "grass_top": {
                fill(ox, oy, TS, 70 + 20 * 0, 150, 60);
                for (let i = 0; i < 50; i++) {
                    const x = ox + (rnd() * TS | 0), y = oy + (rnd() * TS | 0);
                    px(x, y, shade(80, noise() * 26), shade(160, noise() * 26), shade(70, noise() * 20));
                }
                break;
            }
            case "grass_side": {
                fill(ox, oy, TS, 130, 95, 60);
                for (let i = 0; i < 60; i++) {
                    const x = ox + (rnd() * TS | 0), y = oy + (rnd() * TS | 0);
                    px(x, y, shade(140, noise() * 30), shade(105, noise() * 26), shade(66, noise() * 22));
                }
                ctx.fillStyle = "#5aa04a";
                ctx.fillRect(ox, oy, TS, 3);
                px(ox + 2, oy + 2, 240, 250, 220);
                px(ox + 8, oy + 2, 240, 250, 220);
                break;
            }
            case "dirt": {
                fill(ox, oy, TS, 118, 82, 48);
                for (let i = 0; i < 70; i++) {
                    const x = ox + (rnd() * TS | 0), y = oy + (rnd() * TS | 0);
                    px(x, y, shade(126, noise() * 30), shade(92, noise() * 28), shade(52, noise() * 22));
                }
                break;
            }
            case "stone": case "cobble": {
                fill(ox, oy, TS, 128, 128, 128);
                for (let i = 0; i < 70; i++) {
                    const x = ox + (rnd() * TS | 0), y = oy + (rnd() * TS | 0);
                    px(x, y, shade(132, noise() * 26), shade(132, noise() * 26), shade(132, noise() * 26));
                }
                if (name === "cobble") {
                    ctx.strokeStyle = "rgba(70,70,70,0.6)";
                    ctx.strokeRect(ox + 1, oy + 1, 6, 6);
                    ctx.strokeRect(ox + 8, oy + 1, 7, 8);
                    ctx.strokeRect(ox + 1, oy + 9, 8, 6);
                    ctx.strokeRect(ox + 9, oy + 10, 6, 5);
                }
                break;
            }
            case "log_side": {
                fill(ox, oy, TS, 96, 70, 40);
                for (let x = 0; x < TS; x++) {
                    const y = (x % 4 === 0) ? 4 : 11;
                    px(ox + x, oy + y, 70, 50, 28);
                }
                for (let i = 0; i < 22; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, 108, 80, 48);
                break;
            }
            case "log_top": {
                fill(ox, oy, TS, 130, 100, 60);
                for (let i = 0; i < 4; i++) {
                    ctx.beginPath();
                    ctx.fillStyle = "rgba(70,50,28,0.9)";
                    ctx.ellipse(ox + 5 + i * 3, oy + (7 + ((i % 2) * 5)), 2, 1.4, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            }
            case "leaves": {
                fill(ox, oy, TS, 45, 110, 45);
                for (let i = 0; i < 60; i++) {
                    const x = ox + (rnd() * TS | 0), y = oy + (rnd() * TS | 0);
                    px(x, y, shade(50, noise() * 26), shade(115, noise() * 28), shade(45, noise() * 20));
                }
                ctx.fillStyle = "#5ec443";
                for (let i = 0; i < 5; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, 90, 200, 70);
                break;
            }
            case "planks": {
                fill(ox, oy, TS, 190, 160, 110);
                for (let i = 0; i < 60; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(196, noise()*22), shade(165, noise()*22), shade(115, noise()*22));
                ctx.fillStyle = "rgba(120,95,60,0.9)";
                ctx.fillRect(ox, oy + 4, TS, 1);
                ctx.fillRect(ox, oy + 11, TS, 1);
                ctx.fillRect(ox + 5, oy, 1, 4);
                ctx.fillRect(ox + 12, oy + 4, 1, 7);
                ctx.fillRect(ox + 3, oy + 11, 1, 5);
                break;
            }
            case "sand": {
                fill(ox, oy, TS, 220, 200, 130);
                for (let i = 0; i < 60; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(225, noise()*20), shade(205, noise()*20), shade(135, noise()*18));
                break;
            }
            case "water": {
                fill(ox, oy, TS, 60, 130, 210, 0.62);
                for (let i = 0; i < 20; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, 90, 160, 235, 0.5);
                ctx.fillStyle = "rgba(180,220,255,0.5)";
                ctx.fillRect(ox, oy + 6, TS, 1);
                break;
            }
            case "glass": {
                ctx.clearRect(ox, oy, TS, TS);
                ctx.strokeStyle = "rgba(200,235,255,0.95)";
                ctx.lineWidth = 1.2;
                ctx.strokeRect(ox + 1, oy + 1, 6, 6);
                ctx.strokeRect(ox + 9, oy + 2, 6, 6);
                ctx.strokeRect(ox + 2, oy + 9, 6, 6);
                break;
            }
            case "bedrock": {
                fill(ox, oy, TS, 40, 40, 44);
                for (let i = 0; i < 90; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(50, noise()*30), shade(48, noise()*28), shade(52, noise()*28));
                break;
            }
            case "coal": case "iron": case "gold": case "diamond": {
                fill(ox, oy, TS, 130, 130, 130);
                for (let i = 0; i < 70; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(134, noise()*26), shade(134, noise()*26), shade(134, noise()*26));
                const col = name==="coal" ? [40,40,40] : name==="iron" ? [190,150,120] : name==="gold" ? [235,200,80] : [60,225,150];
                for (let i = 0; i < 5; i++) {
                    const x = ox + 2 + rnd()*11, y = oy + 2 + rnd()*11;
                    px(x, y, col[0], col[1], col[2]);
                    px(x+1, y, col[0], col[1], col[2]);
                    px(x, y+1, col[0], col[1], col[2]);
                    px(x+1, y+1, col[0], col[1], col[2]);
                }
                break;
            }
            case "brick": {
                fill(ox, oy, TS, 150, 70, 60);
                for (let i = 0; i < 50; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(156, noise()*20), shade(75, noise()*20), shade(63, noise()*18));
                ctx.fillStyle = "rgba(210,200,200,0.95)";
                ctx.fillRect(ox, oy + 7, TS, 1);
                ctx.fillRect(ox + 5, oy, 1, 7);
                ctx.fillRect(ox + 13, oy + 8, 1, 8);
                break;
            }
            case "tnt_side": {
                fill(ox, oy, TS, 180, 70, 60);
                for (let i = 0; i < 40; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(190, noise()*22), shade(78, noise()*20), shade(66, noise()*18));
                ctx.fillStyle = "#e8e3d8";
                ctx.fillRect(ox, oy + 7, TS, 1);
                ctx.fillStyle = "#2a2620";
                ctx.fillRect(ox + 4, oy + 3, 3, 3);
                ctx.fillRect(ox + 10, oy + 10, 3, 3);
                break;
            }
            case "tnt_top": case "tnt_bottom": {
                fill(ox, oy, TS, 180, 70, 60);
                for (let i = 0; i < 40; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(190, noise()*20), shade(78, noise()*20), shade(66, noise()*18));
                ctx.fillStyle = "#e8e3d8";
                ctx.fillRect(ox, oy + 1, TS, 1);
                ctx.fillRect(ox, oy + 7, TS, 1);
                ctx.fillRect(ox, oy + 13, TS, 1);
                ctx.fillRect(ox + 4, oy + 4, 1, 1);
                ctx.fillRect(ox + 11, oy + 4, 1, 1);
                break;
            }
            case "obsidian": {
                fill(ox, oy, TS, 32, 28, 46);
                for (let i = 0; i < 70; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(40, noise()*22), shade(35, noise()*22), shade(54, noise()*22));
                break;
            }
            case "craft_side": {
                fill(ox, oy, TS, 180, 150, 100);
                for (let i = 0; i < 50; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(186, noise()*20), shade(155, noise()*20), shade(105, noise()*20));
                ctx.fillStyle = "#5a4628";
                ctx.fillRect(ox + 1, oy + 1, 7, 5);
                ctx.fillRect(ox + 9, oy + 1, 6, 5);
                ctx.fillRect(ox + 1, oy + 7, 7, 3);
                ctx.fillRect(ox + 9, oy + 7, 6, 3);
                break;
            }
            case "craft_top": {
                fill(ox, oy, TS, 200, 170, 115);
                for (let i = 0; i < 40; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(205, noise()*18), shade(174, noise()*18), shade(120, noise()*18));
                ctx.fillStyle = "#5a4628";
                ctx.fillRect(ox + 2, oy + 2, 5, 5);
                ctx.fillRect(ox + 8, oy + 2, 5, 5);
                ctx.fillRect(ox + 2, oy + 8, 5, 5);
                ctx.fillRect(ox + 8, oy + 8, 5, 5);
                break;
            }
            case "furnace_side": {
                fill(ox, oy, TS, 110, 110, 112);
                for (let i = 0; i < 50; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(116, noise()*20), shade(116, noise()*20), shade(118, noise()*20));
                ctx.fillStyle = "#1a1a1c";
                ctx.fillRect(ox + 4, oy + 7, 8, 7);
                ctx.fillStyle = "#d9782a";
                ctx.fillRect(ox + 6, oy + 8, 4, 4);
                break;
            }
            case "furnace_top": {
                fill(ox, oy, TS, 120, 120, 124);
                for (let i = 0; i < 50; i++) px(ox + rnd()*TS|0, oy + rnd()*TS|0, shade(126, noise()*18), shade(126, noise()*18), shade(128, noise()*18));
                ctx.strokeStyle = "#1a1a1c";
                ctx.strokeRect(ox + 5, oy + 5, 6, 6);
                break;
            }
            default: {
                // wool / mob palette tiles & fallbacks
                const palette = {
                    "wool_white": [235,230,220], "wool_silver": [140,140,145],
                    "wool_brown": [110,72,40], "skin": [214,160,120],
                    "cream": [230,205,170], "black": [30,30,32],
                    "red": [190,60,50], "gold_block": [240,190,50],
                    "air": [0,0,0,0], "white": [255,255,255]
                };
                const c = palette[name] || [150,150,150,1];
                fill(ox, oy, TS, c[0], c[1], c[2], c.length > 3 ? c[3] : 1);
                for (let i = 0; i < 20; i++) {
                    px(ox + rnd()*TS|0, oy + rnd()*TS|0,
                        MC.clamp(c[0] + noise()*14, 0, 255), MC.clamp(c[1] + noise()*14, 0, 255), MC.clamp(c[2] + noise()*14, 0, 255));
                }
                if (name === "black") {
                    px(ox + 4, oy + 4, 255, 255, 255); px(ox + 5, oy + 4, 255, 255, 255);
                    px(ox + 9, oy + 6, 255, 255, 255); px(ox + 10, oy + 6, 255, 255, 255);
                }
            }
        }
    };

    TILE_NAMES.forEach((name, i) => {
        const col = i % COLS, row = (i / COLS) | 0;
        drawTile(name, col * TS, row * TS);
        MC.TILE[name] = {
            col, row,
            u0: col * TS / cv.width, v0: row * TS / cv.height,
            u1: (col + 1) * TS / cv.width, v1: (row + 1) * TS / cv.height,
        };
    });

    MC.atlasCanvas = cv;
    return cv;
};


/* =========================================================
   01 · SOUND ENGINE (synthesized, Web Audio)
   ======================================================== */
MC.sound = (() => {
    let ctx = null, master = null, enabled = true;
    const ensure = () => {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            master = ctx.createGain();
            master.gain.value = 0.32;
            master.connect(ctx.destination);
        }
        if (ctx.state === "suspended") ctx.resume();
        return ctx;
    };
    const tone = (freq, dur, type, vol, slide) => {
        if (!enabled) return;
        try {
            const c = ensure();
            const o = c.createOscillator();
            const g = c.createGain();
            o.type = type || "square";
            o.frequency.setValueAtTime(freq, c.currentTime);
            if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), c.currentTime + dur);
            g.gain.setValueAtTime(vol || 0.1, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
            o.connect(g); g.connect(master);
            o.start();
            o.stop(c.currentTime + dur + 0.02);
        } catch (e) { /* ignore */ }
    };
    const noiseBurst = (dur, vol, filterFreq) => {
        if (!enabled) return;
        try {
            const c = ensure();
            const n = Math.floor(c.sampleRate * dur);
            const buf = c.createBuffer(1, n, c.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            const src = c.createBufferSource();
            src.buffer = buf;
            const f = c.createBiquadFilter();
            f.type = "lowpass"; f.frequency.value = filterFreq || 1200;
            const g = c.createGain();
            g.gain.setValueAtTime(vol || 0.2, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
            src.connect(f); f.connect(g); g.connect(master);
            src.start();
        } catch (e) { /* ignore */ }
    };
    return {
        toggle(on) { enabled = on; },
        isOn() { return enabled; },
        breakBlock() { noiseBurst(0.12, 0.28, 900); tone(120, 0.08, "square", 0.05, 60); },
        placeBlock() { noiseBurst(0.07, 0.2, 600); tone(160, 0.06, "triangle", 0.05, 90); },
        step() { noiseBurst(0.03, 0.03, 500); },
        jump() { tone(320, 0.1, "sine", 0.05, 520); },
        hurt() { tone(170, 0.22, "sawtooth", 0.14, 70); },
        explosion() { noiseBurst(0.7, 0.6, 400); tone(90, 0.5, "sawtooth", 0.25, 30); },
        craft() { tone(420, 0.07, "square", 0.06, 620); setTimeout(() => tone(600, 0.08, "square", 0.06, 820), 60); },
        pickup() { tone(680, 0.05, "square", 0.05, 900); },
        fuse() { noiseBurst(0.03, 0.08, 4000); },
        level(){ tone(520, 0.12, "square", 0.06, 760); setTimeout(()=>tone(780,0.16,"square",0.06,1040),90); },
    };
})();
MC.sfx = MC.sound;


/* =========================================================
   02 · WORLD
   ======================================================== */
// world maps any non-zero block id (below WH) or 0 for air.
// Chunks stored as Uint8Array(16*96*16). Terrain is generated
// from a seed; player edits are kept as sparse overlays so the
// save remains tiny (seed + edits).

function terrainHeight(x, z, seed) {
    const base = fbm2(x / 90, z / 90, seed, 4, 2, 0.5);
    const hill = fbm2(x / 30, z / 30, seed + 31, 3, 2.2, 0.5);
    let h = 34 + base * 30 + hill * 22;
    const waterBias = fbm2(x / 140, z / 140, seed + 77, 2, 2, 0.5);
    if (waterBias > 0.15) h = MC.lerp(h, 40 + waterBias * 14, 0.45);
    else if (waterBias < -0.2) h = MC.lerp(h, 70 + hill * 18, 0.3); // mountains
    return Math.floor(MC.clamp(h, 3, MC.WH - 12));
}
MC.terrainHeight = terrainHeight;

function isOcean(x, z, seed) { return terrainHeight(x, z, seed) <= MC.WATER - 3; }
function isBeach(x, z, seed) { const h = terrainHeight(x, z, seed); return h > MC.WATER - 3 && h <= MC.WATER + 1; }
function isDesert(x, z, seed) {
    return fbm2(x / 300, z / 300, seed + 5, 2, 2, 0.5) > 0.32;
}
MC.xocean = isOcean;

const ORE_SETTINGS = [
    { block: B_COAL,    f: an => fbm2(an, an * 0.7, 11, 3, 2, 0.5), minY: 5, maxY: 70,  chance: 0.5 },
    { block: B_IRON,    f: an => fbm2(an, an * 0.7, 12, 3, 2, 0.5), minY: 5, maxY: 52,  chance: 0.38 },
    { block: B_GOLD,    f: an => fbm2(an, an * 0.7, 13, 3, 2, 0.5), minY: 5, maxY: 30,  chance: 0.24 },
    { block: B_DIAMOND, f: an => fbm2(an, an * 0.7, 14, 3, 2, 0.5), minY: 5, maxY: 14,  chance: 0.13 },
];

MC.World = class World {
    constructor(seed) {
        this.seed = (seed >>> 0) || 42;
        this.chunks = new Map();     // "cx,cz" -> Uint8Array
        this.dirty = new Map();      // "cx,cz" -> true
        this.n = MC.CH * MC.CH * MC.WH;
        this._h = new Map();         // "x,z" -> height
        this._d = new Map();         // "x,z" -> dessert flag
    }
    hAt(x, z) {
        const k = x + "," + z;
        let h = this._h.get(k);
        if (h === undefined) {
            h = terrainHeight(x, z, this.seed);
            if (this._h.size > 600000) this._h.clear();
            this._h.set(k, h);
        }
        return h;
    }
    dAt(x, z) {
        const k = x + "," + z;
        let v = this._d.get(k);
        if (v === undefined) {
            v = isDesert(x, z, this.seed) ? 1 : 0;
            if (this._d.size > 600000) this._d.clear();
            this._d.set(k, v);
        }
        return v;
    }

    key(cx, cz) { return cx + "," + cz; }
    chunk(cx, cz) {
        const k = this.key(cx, cz);
        let c = this.chunks.get(k);
        if (!c) {
            c = new Uint8Array(this.n);
            this.generateChunk(cx, cz, c);
            this.chunks.set(k, c);
        }
        return c;
    }
    chunkLoaded(cx, cz) { return this.chunks.has(this.key(cx, cz)); }

    index(x, y, z) { return (y * MC.CH + z) * MC.CH + x; }

    // get/set in world space with generate-on-demand
    getBlock(x, y, z) {
        if (y < 0 || y >= MC.WH) return y < 0 ? B_BEDROCK : B_AIR;
        const cx = x >> 4, cz = z >> 4;
        return this.chunk(cx, cz)[this.index(x & 15, y, z & 15)];
    }
    setBlock(x, y, z, id, mark = true) {
        if (y < 0 || y >= MC.WH) return;
        const cx = x >> 4, cz = z >> 4;
        const c = this.chunk(cx, cz);
        c[this.index(x & 15, y, z & 15)] = id & 0xff;
        this.markDirty(cx, cz);
        if (mark) {
            // neighbors need remesh when edge-touching
            const lx = x & 15, lz = z & 15;
            if (lx === 0) this.markDirty(cx - 1, cz);
            if (lx === 15) this.markDirty(cx + 1, cz);
            if (lz === 0) this.markDirty(cx, cz - 1);
            if (lz === 15) this.markDirty(cx, cz + 1);
        }
    }
    markDirty(cx, cz) { this.dirty.set(cx + "," + cz, true); }

    blockInfo(id) { return BLOCKS[id] || BLOCKS[0]; }

    /* terrain generation */
    terrainAt(x, y, z, seed) {
        const h = this.hAt(x, z);
        if (y === 0) return B_BEDROCK;
        const trunk = this.trunkAt(x, y, z, seed);
        if (trunk) return B_LOG;
        if (y < h) {
            if (y >= h - 4) {
                if (this.dAt(x, z)) return B_SAND;
                return y === h - 1 ? B_GRASS : B_DIRT;
            }
            const r = (hash2i(x, z, seed) % 100) / 100;
            if (r < 55) {
                const an = hash2i(x, z, seed) / 4294967296;
                for (const ore of ORE_SETTINGS) {
                    if (y >= ore.minY && y <= ore.maxY) {
                        const v = ore.f(an);
                        if (v > 1 - ore.chance) return ore.block;
                    }
                }
            }
            return B_STONE;
        }
        if (y > h) {
            const t = this.canopyAt(x, y, z, seed);
            if (t) return t;
        }
        if (h < MC.WATER && y >= h && y <= MC.WATER) return B_WATER;
        return B_AIR;
    }

    trunkAt(x, y, z, seed) {
        const h = this.hAt(x, z);
        if (h > MC.WATER + 1 || this.dAt(x, z)) return 0;
        if (y < h || y > h + 4) return 0;
        if ((hash2i(x, z, seed) % 1000) < 60) return B_LOG;
        return 0;
    }

    canopyAt(x, y, z, seed) {
        if (y < 0 || y >= MC.WH) return 0;
        // which trunks could cover this cell
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                const gx = (x + dx), gz = (z + dz);
                const gh = this.hAt(gx, gz);
                if (gh > MC.WATER + 1 || this.dAt(gx, gz)) continue;
                if ((hash2i(gx, gz, seed) % 1000) >= 60) continue;
                for (let dy = -2; dy <= 1; dy++) {
                    if (y === gh + dy) {
                        if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy + 1) < 6) {
                            if (y > gh) return B_LEAVES;
                        }
                    }
                }
            }
        }
        return 0;
    }

    generateChunk(cx, cz, data) {
        const s = this.seed;
        for (let bz = 0; bz < MC.CH; bz++) {
            for (let bx = 0; bx < MC.CH; bx++) {
                const wx = cx * MC.CH + bx, wz = cz * MC.CH + bz;
                for (let y = 0; y < MC.WH; y++) {
                    data[this.index(bx, y, bz)] = this.terrainAt(wx, y, wz, s);
                }
            }
        }
    }

    genHeight(wx, wz) { return this.hAt(wx, wz); }

    findSpawn() {
        for (let rx = 0; rx < 8; rx++) {
            for (let rz = 0; rz < 8; rz++) {
                const x = (rx * 17) - 64, z = (rz * 13) - 64;
                const h = this.genHeight(x, z);
                if (h > MC.WATER + 1) return { x: x + 0.5, y: h + 1.2, z: z + 0.5 };
            }
        }
        return { x: 0.5, y: MC.WATER + 3, z: 0.5 };
    }

    /* edit overlays for save */
    overlayMap() {
        // returns object: "x,y,z" -> id for blocks that differ from generated
        const out = {};
        this.dirty.forEach((_, k) => {
            const [cx, cz] = k.split(",").map(Number);
            const c = this.chunks.get(k);
            if (!c) return;
            for (let y = 0; y < MC.WH; y++) {
                for (let bz = 0; bz < MC.CH; bz++) {
                    for (let bx = 0; bx < MC.CH; bx++) {
                        const w = c[this.index(bx, y, bz)];
                        const re = this.generatedBlock(cx * MC.CH + bx, y, cz * MC.CH + bz);
                        if (w !== re) out[(cx * MC.CH + bx) + "," + y + "," + (cz * MC.CH + bz)] = w;
                    }
                }
            }
        });
        return out;
    }

    generatedBlock(x, y, z) {
        // regenerate expected value for a single column position (only used per dirty chunk)
        const h = this.genHeight(x, z);
        let id = B_AIR;
        if (y === 0) id = B_BEDROCK;
        else if (y < h) {
            if (y > h - 4) {
                if (isDesert(x, z, this.seed)) id = B_SAND;
                else id = y === h - 1 ? B_GRASS : B_DIRT;
            } else id = B_STONE;
        }
        if (y === 0) id = B_BEDROCK;
        if (h < MC.WATER && y >= h && y <= MC.WATER) id = B_WATER;
        return id;
    }
};


/* =========================================================
   02 · CHUNK MESHING
   ======================================================== */
MC.buildMesh = (world, cx, cz) => {
    // returns { seg: { opaque: {v,id,count}, water: {...}, verts: [...], ints: [...] } }
    const style = BLOCKS;
    // coordinate helpers for tile uv lookup
    const tile = (name) => MC.TILE[name] || MC.TILE["stone"];
    const T = (name) => { const t = tile(name); return [t.u0, t.v0, t.u1, t.v1]; };

    const faces = {}; // per tile-uv accumulation (floats & uints)
    const keyOf = (u0, v0, u1, v1, shade, isWater) =>
        (isWater ? "water_" : "opaque_") + u0.toFixed(3) + "_" + v0.toFixed(3) + "_" + u1.toFixed(3) + "_" + v1.toFixed(3) + "_s" + (shade*100|0);
    const buckets = new Map(); // key -> {v:[], i:[], n:0, water:bool}

    const addFace = (x, y, z, u0, v0, u1, v1, shade, nx, ny, nz, isWater) => {
        const k = keyOf(u0, v0, u1, v1, shade, isWater);
        let b = buckets.get(k);
        if (!b) { b = { v: [], i: [], n: 0, water: isWater }; buckets.set(k, b); }
        // choose orientation indicator via shade anyway; windings with culling OFF are fine
        // emit 4 verts + 6 indices (two tris), both same winding (culling disabled)
        const [DX, DY, DZ, S, VD] = (() => {
            if (nx === 1) return [ 0, 1, 1, 1, 1];
            if (nx === -1)return [ 0, 1, 1, 1, 1];
            if (ny === 1) return [ 1, 0, 1, 1, 1];
            if (ny === -1)return [ 1, 0, 1, 1, 1];
            return [1, 1, 0, 1, 1];
        })();
        void DX; void DY; void DZ; void S; void VD; // keep args referenced
        // corners as offsets
        const add = (dx, dy, dz, u, v) => {
            b.v.push(x + dx, y + dy, z + dz, u, v, shade);
        };
        // face plane dependent corners
        if (ny === 1) {         // top (+Y)
            add(0, 1, 0, u0, v0); add(1, 1, 0, u1, v0); add(1, 1, 1, u1, v1); add(0, 1, 1, u0, v1);
        } else if (ny === -1) { // bottom (-Y)
            add(0, 0, 0, u0, v0); add(1, 0, 0, u1, v0); add(1, 0, 1, u1, v1); add(0, 0, 1, u0, v1);
        } else if (nx === 1) {  // east (+X)
            add(1, 0, 0, u0, v1); add(1, 1, 0, u0, v0); add(1, 1, 1, u1, v0); add(1, 0, 1, u1, v1);
        } else if (nx === -1) { // west (-X)
            add(0, 0, 1, u0, v1); add(0, 1, 1, u0, v0); add(0, 1, 0, u1, v0); add(0, 0, 0, u1, v1);
        } else if (nz === 1) {  // south (+Z)
            add(0, 0, 1, u1, v1); add(1, 0, 1, u0, v1); add(1, 1, 1, u0, v0); add(0, 1, 1, u1, v0);
        } else {                // north (-Z)
            add(0, 0, 0, u0, v1); add(1, 0, 0, u1, v1); add(1, 1, 0, u1, v0); add(0, 1, 0, u0, v0);
        }
        const base = b.n;
        b.i.push(base + 0, base + 1, base + 2, base + 0, base + 2, base + 3);
        b.n += 4;
    };

    const getIfChunk = (x, y, z) => {
        if (y < 0) return B_BEDROCK;
        if (y >= MC.WH) return B_AIR;
        const ccx = x >> 4, ccz = z >> 4;
        if (ccx === cx && ccz === cz) {
            const c = world.chunks.get(world.key(cx, cz));
            return c ? c[world.index(x & 15, y, z & 15)] : B_AIR;
        }
        return world.getBlock(x, y, z);
    };

    // face exposure: NB opaque neighbor => skip; transparent neighbor => face; air => face
    const isOpaque = id => id > 0 && id !== B_WATER && id !== B_GLASS && id !== B_LEAVES && !BLOCKS[id].water;
    const isSeeThrough = id => id === B_WATER || id === B_GLASS || id === B_LEAVES;

    const c = world.chunk(cx, cz);
    const startX = cx * MC.CH, startZ = cz * MC.CH;

    for (let bz = 1; bz < MC.CH - 1; bz++) {
        for (let bx = 1; bx < MC.CH - 1; bx++) {
            const wx = startX + bx, wz = startZ + bz;
            const syLocal = terrainHeight(wx, wz, world.seed);
            const sunGrad = yLevel => MC.clamp(0.55 + (yLevel - Math.max(syLocal, MC.WATER)) * 0.5, 0, 1) * (1 - Math.max(0, (MC.WATER - yLevel)) * 0.06);
            for (let y = 0; y < MC.WH; y++) {
                const id = c[world.index(bx, y, bz)];
                if (id === 0) continue;
                const bl = style[id];
                if (bl.water) continue; // water handled in second pass
                if (bl.transparent && !bl.water) {
                    // glass/leaves: draw thin faces toward opaque (no neighbor face)
                    if (isOpaque(getIfChunk(wx, y, bz + 1))) addFace(wx, y, wz, ...T(bl.tile), 0.8, 0, 0, 1, false);
                    if (isOpaque(getIfChunk(wx, y, bz - 1))) addFace(wx, y, wz, ...T(bl.tile), 0.8, 0, 0, -1, false);
                    if (isOpaque(getIfChunk(wx + 1, y, bz))) addFace(wx, y, wz, ...T(bl.tile), 0.9, 1, 0, 0, false);
                    if (isOpaque(getIfChunk(wx - 1, y, bz))) addFace(wx, y, wz, ...T(bl.tile), 0.75, -1, 0, 0, false);
                    if (isOpaque(getIfChunk(wx, y + 1, bz))) addFace(wx, y, wz, ...T(bl.tile), 1, 0, 1, 0, false);
                    if (isOpaque(getIfChunk(wx, y - 1, bz))) addFace(wx, y, wz, ...T(bl.tile), 0.6, 0, -1, 0, false);
                    continue;
                }
                // normal block: faces to air OR see-through
                const up = getIfChunk(wx, y + 1, bz), dn = getIfChunk(wx, y - 1, bz);
                const e = getIfChunk(wx + 1, y, bz), w = getIfChunk(wx - 1, y, bz);
                const n = getIfChunk(wx, y, bz + 1), so = getIfChunk(wx, y, bz - 1);
                const topTex = bl.top || bl.all, sideTex = bl.side || bl.all, botTex = bl.bottom || bl.all;
                const sh = sunGrad(y) * 0.94 + 0.06;

                if (!isOpaque(up) && !(up === B_WATER)) addFace(wx, y, wz, ...T(topTex), sh * 1.0, 0, 1, 0, false);
                if (!isOpaque(dn) && !(dn === B_WATER)) addFace(wx, y, wz, ...T(botTex), sh * 0.58, 0, -1, 0, false);
                if (!isOpaque(e) && !(e === B_WATER)) addFace(wx, y, wz, ...T(sideTex), sh * 0.86, 1, 0, 0, false);
                if (!isOpaque(w) && !(w === B_WATER)) addFace(wx, y, wz, ...T(sideTex), sh * 0.72, -1, 0, 0, false);
                if (!isOpaque(n) && !(n === B_WATER)) addFace(wx, y, wz, ...T(sideTex), sh * 0.80, 0, 0, 1, false);
                if (!isOpaque(so) && !(so === B_WATER)) addFace(wx, y, wz, ...T(sideTex), sh * 0.80, 0, 0, -1, false);
            }
        }
    }
    // water pass (no tiles to neighbor water)
    for (let y = 0; y <= MC.WATER; y++) {
        for (let bz = 1; bz < MC.CH - 1; bz++) {
            for (let bx = 1; bx < MC.CH - 1; bx++) {
                const id = c[world.index(bx, y, bz)];
                if (id !== B_WATER) continue;
                const wx = startX + bx, wz = startZ + bz;
                const bl = style[id];
                const t = T(bl.tile);
                const up = getIfChunk(wx, y + 1, bz);
                const below = getIfChunk(wx, y - 1, bz);
                const sh = 0.6;
                if (up === B_AIR) addFace(wx, y, wz, t[0], t[1], t[2], t[3], sh, 0, 1, 0, true);
                if (below === B_AIR) addFace(wx, y, wz, t[0], t[1], t[2], t[3], sh, 0, -1, 0, true);
                const e = getIfChunk(wx + 1, y, bz);
                if (e === B_AIR || e === B_GLASS || e === B_LEAVES) addFace(wx, y, wz, t[0], t[1], t[2], t[3], sh * 0.85, 1, 0, 0, true);
                const w2 = getIfChunk(wx - 1, y, bz);
                if (w2 === B_AIR || w2 === B_GLASS || w2 === B_LEAVES) addFace(wx, y, wz, t[0], t[1], t[2], t[3], sh * 0.7, -1, 0, 0, true);
                const n2 = getIfChunk(wx, y, bz + 1);
                if (n2 === B_AIR || n2 === B_GLASS || n2 === B_LEAVES) addFace(wx, y, wz, t[0], t[1], t[2], t[3], sh * 0.78, 0, 0, 1, true);
                const s2 = getIfChunk(wx, y, bz - 1);
                if (s2 === B_AIR || s2 === B_GLASS || s2 === B_LEAVES) addFace(wx, y, wz, t[0], t[1], t[2], t[3], sh * 0.78, 0, 0, -1, true);
                // also faces toward non-water solid below? none needed at edges against opaque are rare in ocean; skip.
            }
        }
    }

    // package
    return { buckets };
};



/* =========================================================
   02 · SAVE / LOAD
   ======================================================== */
MC.SAVE_KEY = "mcquest_save_v1";
MC.menuKey  = "mcquest_menu_v1";

MC.saveWorld = (world, player, isSingleMode) => {
    try {
        const data = {
            seed: world.seed,
            edits: world.overlayMap(),
            player: player && player.pos ? {
                x: player.pos[0], y: player.pos[1], z: player.pos[2],
                hp: player.hp, hunger: player.hunger, mode: isSingleMode,
                inventory: player.inventory, hotbar: player.hotbarSlot,
                time: player.time,
            } : null,
            savedAt: Date.now(),
        };
        localStorage.setItem(MC.SAVE_KEY, JSON.stringify(data));
        return true;
    } catch (e) { console.warn("save failed", e); return false; }
};

MC.loadWorld = () => {
    try {
        const raw = localStorage.getItem(MC.SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || typeof data.seed !== "number") return null;
        return data;
    } catch (e) { return null; }
};

MC.clearSave = () => { try { localStorage.removeItem(MC.SAVE_KEY); } catch (e) {} };

MC.applyEdits = (world, edits) => {
    if (!edits) return;
    let c = 0;
    for (const k in edits) {
        const [x, y, z] = k.split(",").map(Number);
        world.setBlock(x, y, z, edits[k], false);
        c++;
    }
    if (c > 0) { world.dirty.clear(); }
};

// [07-PART3]

/* =========================================================
   03 · MATH (minimal mat4)
   ======================================================== */
MC.mat4 = {};
MC.mat4.identity = out => { out[0]=1;out[1]=0;out[2]=0;out[3]=0;out[4]=0;out[5]=1;out[6]=0;out[7]=0;out[8]=0;out[9]=0;out[10]=1;out[11]=0;out[12]=0;out[13]=0;out[14]=0;out[15]=1; return out; };
MC.mat4.perspective = (out, fovy, aspect, near, far) => {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    out[0]=f/aspect;out[1]=0;out[2]=0;out[3]=0;
    out[4]=0;out[5]=f;out[6]=0;out[7]=0;
    out[8]=0;out[9]=0;out[10]=(far+near)*nf;out[11]=-1;
    out[12]=0;out[13]=0;out[14]=2*far*near*nf;out[15]=0;
    return out;
};
MC.mat4.lookAt = (out, eye, center, up) => {
    let zx = eye[0]-center[0], zy=eye[1]-center[1], zz=eye[2]-center[2];
    let len = 1/Math.hypot(zx,zy,zz); zx*=len;zy*=len;zz*=len;
    let xx = up[1]*zz-up[2]*zy, xy = up[2]*zx-up[0]*zz, xz = up[0]*zy-up[1]*zx;
    len = 1/Math.hypot(xx,xy,xz); xx*=len;xy*=len;xz*=len;
    const yx = zy*xz-zz*xy, yy = zz*xx-zx*xz, yz = zx*xy-zy*xx;
    out[0]=xx;out[1]=yx;out[2]=zx;out[3]=0;
    out[4]=xy;out[5]=yy;out[6]=zy;out[7]=0;
    out[8]=xz;out[9]=yz;out[10]=zz;out[11]=0;
    out[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2]);
    out[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2]);
    out[14]=-(zx*eye[0]+zy*eye[1]+zz*eye[2]);
    out[15]=1;
    return out;
};
MC.mat4.multiply = (out, a, b) => {
    const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a10=a[4],a11=a[5],a12=a[6],a13=a[7],
          a20=a[8],a21=a[9],a22=a[10],a23=a[11],a30=a[12],a31=a[13],a32=a[14],a33=a[15];
    let b0=b[0],b1=b[1],b2=b[2],b3=b[3];
    out[0]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[1]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[2]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[3]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[4];b1=b[5];b2=b[6];b3=b[7];
    out[4]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[5]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[6]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[7]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[8];b1=b[9];b2=b[10];b3=b[11];
    out[8]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[9]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[10]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[11]=b0*a03+b1*a13+b2*a23+b3*a33;
    b0=b[12];b1=b[13];b2=b[14];b3=b[15];
    out[12]=b0*a00+b1*a10+b2*a20+b3*a30;
    out[13]=b0*a01+b1*a11+b2*a21+b3*a31;
    out[14]=b0*a02+b1*a12+b2*a22+b3*a32;
    out[15]=b0*a03+b1*a13+b2*a23+b3*a33;
    return out;
};
MC.mat4.translate = (out, a, v) => {
    let x=v[0],y=v[1],z=v[2];
    out[12]=a[0]*x+a[4]*y+a[8]*z+a[12];
    out[13]=a[1]*x+a[5]*y+a[9]*z+a[13];
    out[14]=a[2]*x+a[6]*y+a[10]*z+a[14];
    out[15]=a[3]*x+a[7]*y+a[11]*z+a[15];
    if (out===a) return out;
    out[0]=a[0];out[1]=a[1];out[2]=a[2];out[3]=a[3];
    out[4]=a[4];out[5]=a[5];out[6]=a[6];out[7]=a[7];
    out[8]=a[8];out[9]=a[9];out[10]=a[10];out[11]=a[11];
    return out;
};
MC.mat4.rotateX = (out,a,rad)=>{
    const s=Math.sin(rad),c=Math.cos(rad);
    const a10=a[4],a11=a[5],a12=a[6],a13=a[7],a20=a[8],a21=a[9],a22=a[10],a23=a[11];
    out[4]=a10*c+a20*s; out[5]=a11*c+a21*s; out[6]=a12*c+a22*s; out[7]=a13*c+a23*s;
    out[8]=a20*c-a10*s; out[9]=a21*c-a11*s; out[10]=a22*c-a12*s; out[11]=a23*c-a13*s;
    return out;
};
MC.mat4.rotateY = (out,a,rad)=>{
    const s=Math.sin(rad),c=Math.cos(rad);
    const a00=a[0],a01=a[1],a02=a[2],a03=a[3],a20=a[8],a21=a[9],a22=a[10],a23=a[11];
    out[0]=a00*c-a20*s; out[1]=a01*c-a21*s; out[2]=a02*c-a22*s; out[3]=a03*c-a23*s;
    out[8]=a00*s+a20*c; out[9]=a01*s+a21*c; out[10]=a02*s+a22*c; out[11]=a03*s+a23*c;
    return out;
};
MC.mat4.scale = (out,a,v)=>{
    out[0]=a[0]*v[0];out[1]=a[1]*v[0];out[2]=a[2]*v[0];out[3]=a[3]*v[0];
    out[4]=a[4]*v[1];out[5]=a[5]*v[1];out[6]=a[6]*v[1];out[7]=a[7]*v[1];
    out[8]=a[8]*v[2];out[9]=a[9]*v[2];out[10]=a[10]*v[2];out[11]=a[11]*v[2];
    out[12]=a[12];out[13]=a[13];out[14]=a[14];out[15]=a[15];
    return out;
};
MC.mat4.copy = (out,a)=>{ for (let i=0;i<16;i++) out[i]=a[i]; return out; };


/* =========================================================
   03 · SHADERS
   ======================================================== */
function compileShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("shader compile error:", gl.getShaderInfoLog(sh));
        return null;
    }
    return sh;
}
function buildProgram(gl, vsSrc, fsSrc) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error("program link error:", gl.getProgramInfoLog(p));
        return null;
    }
    return p;
}

const BLOCK_VS = `
attribute vec3 aPos;
attribute vec2 aUV;
attribute float aShade;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform vec3 uCam;
varying vec2 vUV;
varying float vShade;
varying float vDist;
void main(){
  vec4 wp = uModel * vec4(aPos, 1.0);
  vUV = aUV; vShade = aShade;
  vDist = length(wp.xyz - uCam);
  gl_Position = uProj * uView * wp;
}`;

const BLOCK_FS = `
precision mediump float;
varying vec2 vUV;
varying float vShade;
varying float vDist;
uniform sampler2D uTex;
uniform vec3 uFog;
uniform float uFogStart;
uniform float uFogEnd;
uniform float uWater;
void main(){
  vec4 t = texture2D(uTex, vUV);
  if (t.a < 0.4) discard;
  vec3 col = t.rgb * vShade;
  float f = clamp((vDist - uFogStart) / (uFogEnd - uFogStart), 0.0, 1.0);
  col = mix(col, uFog, f);
  if (uWater > 0.5) {
    gl_FragColor = vec4(col * 1.15, 0.66);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}`;

const SKY_VS = `
attribute vec3 aDir;
uniform mat4 uProj;
uniform mat4 uView;
uniform float uScale;
varying vec3 vDir;
void main(){
  vDir = aDir;
  vec4 wp = vec4(aDir * uScale + vec3(0.0,0.0,0.0), 1.0);
  gl_Position = uProj * uView * wp;
}`;

const SKY_FS = `
precision mediump float;
varying vec3 vDir;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform float uSunFactor;
void main(){
  float h = clamp(vDir.y, -0.2, 1.0);
  vec3 col = mix(uHorizon, uZenith, h);
  gl_FragColor = vec4(col, 1.0);
}`;

const CLOUD_VS = `
attribute vec2 aCorner;
uniform mat4 uProj;
uniform mat4 uView;
uniform vec3 uCenter;
uniform float uSize;
uniform float uScroll;
varying vec2 vUV;
void main(){
  vec2 off = aCorner;
  vec3 wp = vec3(uCenter.x + off.x * uSize, uCenter.y, uCenter.z + off.y * uSize);
  vUV = (off * uSize * 0.0625) + vec2(uScroll, uScroll * 0.6);
  gl_Position = uProj * uView * vec4(wp, 1.0);
}`;

const CLOUD_FS = `
precision mediump float;
uniform sampler2D uTex;
uniform vec3 uFog;
varying vec2 vUV;
void main(){
  vec4 t = texture2D(uTex, fract(vUV));
  float a = t.a * 0.86;
  if (a < 0.02) discard;
  gl_FragColor = vec4(uFog * 0.98, a);
}`;

const BILLBOARD_VS = `
attribute vec2 aCorner;
uniform mat4 uProj;
uniform mat4 uView;
uniform vec3 uAt;
uniform float uSize;
varying vec2 vUV;
void main(){
  // derive right/up from view
  vec3 fwd = -vec3(uView[2][0], uView[2][1], uView[2][2]);
  vec3 worldUp = vec3(0.0, 1.0, 0.0);
  vec3 right = normalize(cross(worldUp, fwd));
  vec3 up = cross(fwd, right);
  vec3 wp = uAt + right * aCorner.x * uSize + up * aCorner.y * uSize;
  vUV = aCorner * 0.5 + 0.5;
  gl_Position = uProj * uView * vec4(wp, 1.0);
}`;

const BILLBOARD_FS = `
precision mediump float;
uniform sampler2D uTex;
uniform vec3 uColor;
uniform float uAlpha;
varying vec2 vUV;
void main(){
  vec4 t = texture2D(uTex, vUV);
  gl_FragColor = vec4(uColor * t.rgb, t.a * uAlpha);
}`;

const STAR_VS = `
attribute vec3 aDir;
attribute float aSize;
uniform mat4 uProj;
uniform mat4 uView;
uniform float uScale;
varying float vA;
void main(){
  vA = aSize;
  vec4 wp = vec4(aDir * uScale, 1.0);
  gl_Position = uProj * uView * wp;
  gl_PointSize = aSize;
}`;

const STAR_FS = `
precision mediump float;
uniform vec3 uColor;
varying float vA;
void main(){
  float d = distance(gl_PointCoord, vec2(0.5));
  float a = smoothstep(0.5, 0.0, d) * vA;
  if (a < 0.02) discard;
  gl_FragColor = vec4(uColor, a);
}`;

const UNI_VS = `
attribute vec3 aPos;
attribute vec2 aUV;
uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
varying vec2 vUV;
void main(){
  gl_Position = uProj * uView * uModel * vec4(aPos, 1.0);
  vUV = aUV;
}`;

const UNI_FS = `
precision mediump float;
varying vec2 vUV;
uniform sampler2D uTex;
uniform vec3 uColor;
uniform vec3 uFog;
uniform float uFogStart;
uniform float uFogEnd;
uniform float uCamY;
void main(){
  vec4 t = texture2D(uTex, vUV);
  if (t.a < 0.4) discard;
  vec3 col = t.rgb * uColor;
  gl_FragColor = vec4(col, 1.0);
}`;


/* =========================================================
   03 · CHUNK GEOMETRY BUFFERS
   ======================================================== */
MC.ChunkRender = class {
    constructor(gl, mesh) {
        this.gl = gl;
        this.list = [];   // {vbo, ibo, idx, water}
        this.deleted = false;
        const buckets = mesh.buckets instanceof Map ? mesh.buckets.values() : Object.values(mesh.buckets);
        for (const b of buckets) {
            if (!b.n) continue;
            this.push(gl, b.v, b.i, b.water);
        }
    }
    // b.n is a running VERTEX count (4/quad); split into parts so indices never exceed
    // Uint16 range (65535) even for giant carved-out chunks.
    push(gl, v, i, water) {
        const MAXV = 65000;
        const faces = i.length / 6;
        let face = 0;
        while (face < faces) {
            let lo = Infinity, hi = -1, end = faces;
            for (let f = face; f < faces; f++) {
                const a = f * 6;
                let nlo = lo, nhi = hi;
                for (let j = 0; j < 6; j++) {
                    const vi = i[a + j];
                    if (vi < nlo) nlo = vi;
                    if (vi > nhi) nhi = vi;
                }
                if (nhi - nlo >= MAXV) { end = f; break; }
                lo = nlo; hi = nhi;
                end = f + 1;
            }
            if (end === face) end = face + 1; // single oversized face: force progress
            const count = end - face;
            const vCount = hi - lo + 1;
            const pv = new Float32Array(vCount * 6);
            for (let r = 0; r < vCount * 6; r++) pv[r] = v[lo * 6 + r];
            const pi = new Uint16Array(count * 6);
            for (let r = 0; r < count * 6; r++) pi[r] = i[face * 6 + r] - lo;
            const vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, pv, gl.STATIC_DRAW);
            const ibo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, pi, gl.STATIC_DRAW);
            this.list.push({ vbo, ibo, idx: count * 6, water });
            face = end;
        }
    }
    dispose(gl) {
        if (this.deleted) return;
        this.deleted = true;
        for (const r of this.list) { gl.deleteBuffer(r.vbo); gl.deleteBuffer(r.ibo); }
        this.list = [];
    }
};


/* =========================================================
   03 · RENDERER
   ======================================================== */
MC.gfx = (() => {
    let gl = null, canvas = null, world = null;
    let proj, view, model, mlook;
    let progBlock, progSky, progCloud, progBill, progStar, progUni;
    let dome, starBuf, quadUv, quadIdxBuf;
    let cloudTex, billTexs = {};
    let shadeAttribs;

    const renderList = new Map();   // "cx,cz" -> ChunkRender
    const toBuild = new Set();      // "cx,cz" waiting to mesh

    const makeQuad = () => {
        // billboard & cloud corners -1..1
        return new Float32Array([-1,-1, 1,-1, 1,1, -1,1]);
    };
    const quadIndices = new Uint16Array([0,1,2, 0,2,3]);

    const mkDome = () => {
        const verts = new Float32Array((12 * 40 + 2) * 3);
        let o = 0;
        const R = 1;
        for (let lat = -4; lat <= 10; lat++) {
            const v = lat / 10 * Math.PI / 2 * 1.07 - 0.05;
            const y = Math.sin(v), r = Math.cos(v);
            for (let lon = 0; lon < 40; lon++) {
                const t = lon / 40 * Math.PI * 2;
                verts[o++] = Math.cos(t) * r;
                verts[o++] = y;
                verts[o++] = Math.sin(t) * r;
            }
        }
        const idx = new Uint16Array((11 * 40) * 6);
        let p = 0;
        for (let lat = 0; lat < 11; lat++) {
            for (let i = 0; i < 40; i++) {
                const a = lat * 40 + i, b = (lat + 1) * 40 + i;
                const a2 = lat * 40 + (i + 1) % 40, b2 = (lat + 1) * 40 + (i + 1) % 40;
                idx[p++] = a; idx[p++] = a2; idx[p++] = b2;
                idx[p++] = a; idx[p++] = b2; idx[p++] = b;
            }
        }
        return { verts, idx };
    };

    const mkStars = (n) => {
        const dirs = new Float32Array(n * 3), sizes = new Float32Array(n);
        const rnd = MC.mulberry32(999);
        for (let i = 0; i < n; i++) {
            const v = Math.acos(rnd() * 2 - 1);
            const t = rnd() * Math.PI * 2;
            dirs[i*3] = Math.sin(v) * Math.cos(t);
            dirs[i*3+1] = Math.abs(Math.sin(v) * Math.sin(t)) * 0.9 + 0.08; // upper hemisphere
            dirs[i*3+2] = Math.cos(v);
            sizes[i] = 1.5 + rnd() * 2.5;
        }
        return { dirs, sizes };
    };

    const mkCloudTex = () => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 128;
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 128, 128);
        const rnd = MC.mulberry32(777);
        ctx.fillStyle = "#fff";
        for (let i = 0; i < 90; i++) {
            const x = rnd() * 128, y = rnd() * 128, s = 5 + rnd() * 14;
            ctx.globalAlpha = 0.7 + rnd() * 0.3;
            ctx.beginPath();
            ctx.ellipse(x, y, s, s * 0.6, rnd() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        return cv;
    };

    const mkBillTex = (inner, outer, innerA) => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 64;
        const ctx = cv.getContext("2d");
        const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
        g.addColorStop(0, `rgba(${inner},${innerA ?? 1})`);
        g.addColorStop(1, `rgba(${outer})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 64, 64);
        return cv;
    };

    const makeTex = (source, wrap) => {
        const gl0 = gl;
        const t = gl0.createTexture();
        gl0.bindTexture(gl0.TEXTURE_2D, t);
        gl0.texImage2D(gl0.TEXTURE_2D, 0, gl0.RGBA, gl0.RGBA, gl0.UNSIGNED_BYTE, source);
        gl0.texParameteri(gl0.TEXTURE_2D, gl0.TEXTURE_MIN_FILTER, gl0.NEAREST);
        gl0.texParameteri(gl0.TEXTURE_2D, gl0.TEXTURE_MAG_FILTER, gl0.NEAREST);
        const wmode = (wrap === "repeat") ? gl0.REPEAT : gl0.CLAMP_TO_EDGE;
        gl0.texParameteri(gl0.TEXTURE_2D, gl0.TEXTURE_WRAP_S, wmode);
        gl0.texParameteri(gl0.TEXTURE_2D, gl0.TEXTURE_WRAP_T, wmode);
        return t;
    };

    const init = (w) => {
        world = w;
        canvas = MC.canvas;
        gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: true, powerPreference: "high-performance" });
        if (!gl) { alert("WebGL not supported by this browser."); return false; }
        gl.disable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.clearDepth(1);

        progBlock = buildProgram(gl, BLOCK_VS, BLOCK_FS);
        progSky = buildProgram(gl, SKY_VS, SKY_FS);
        progCloud = buildProgram(gl, CLOUD_VS, CLOUD_FS);
        progBill = buildProgram(gl, BILLBOARD_VS, BILLBOARD_FS);
        progStar = buildProgram(gl, STAR_VS, STAR_FS);
        progUni = buildProgram(gl, UNI_VS, UNI_FS);

        // chunk attributes
        shadeAttribs = {
            aPos: gl.getAttribLocation(progBlock, "aPos"),
            aUV: gl.getAttribLocation(progBlock, "aUV"),
            aShade: gl.getAttribLocation(progBlock, "aShade"),
            uProj: gl.getUniformLocation(progBlock, "uProj"),
            uView: gl.getUniformLocation(progBlock, "uView"),
            uModel: gl.getUniformLocation(progBlock, "uModel"),
            uCam: gl.getUniformLocation(progBlock, "uCam"),
            uTex: gl.getUniformLocation(progBlock, "uTex"),
            uFog: gl.getUniformLocation(progBlock, "uFog"),
            uFogStart: gl.getUniformLocation(progBlock, "uFogStart"),
            uFogEnd: gl.getUniformLocation(progBlock, "uFogEnd"),
            uWater: gl.getUniformLocation(progBlock, "uWater"),
        };

        // atlas texture
        MC.atlasTex = makeTex(MC.atlasCanvas, "clamp");

        // cloud texture
        cloudTex = makeTex(mkCloudTex(), "repeat");
        quadUv = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadUv);
        gl.bufferData(gl.ARRAY_BUFFER, makeQuad(), gl.STATIC_DRAW);
        quadIdxBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quadIdxBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW);

        // hemisphere dome
        const d = mkDome();
        dome = { verts: gl.createBuffer(), idx: gl.createBuffer(), vn: 12 * 40 + 2, ic: (11 * 40) * 6 };
        gl.bindBuffer(gl.ARRAY_BUFFER, dome.verts);
        gl.bufferData(gl.ARRAY_BUFFER, d.verts, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dome.idx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, d.idx, gl.STATIC_DRAW);

        // stars
        const st = mkStars(360);
        starBuf = { verts: gl.createBuffer(), sizes: gl.createBuffer(), n: 360 };
        gl.bindBuffer(gl.ARRAY_BUFFER, starBuf.verts);
        gl.bufferData(gl.ARRAY_BUFFER, st.dirs, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, starBuf.sizes);
        gl.bufferData(gl.ARRAY_BUFFER, st.sizes, gl.STATIC_DRAW);

        // billboard textures (sun/moon/billboards for items? not now)
        billTexs.sun = makeTex(mkBillTex("255,244,180", "255,190,90,0", 1), "clamp");
        billTexs.moon = makeTex(mkBillTex("235,240,255", "150,170,220,0", 1), "clamp");

        proj = MC.mat4.identity(new Float32Array(16));
        view = MC.mat4.identity(new Float32Array(16));
        model = MC.mat4.identity(new Float32Array(16));
        mlook = MC.mat4.identity(new Float32Array(16));

        gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
        return true;
    };

    const setCanvas = () => {
        if (!canvas || !gl) return;
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
        gl.viewport(0, 0, w, h);
    };

    const setWorld = (w) => {
        world = w;
        for (const cr of renderList.values()) cr.dispose(gl);
        renderList.clear();
        toBuild.clear();
    };

    // ----- chunk meshing orchestration -----
    const meshChunk = (cx, cz) => {
        const key = cx + "," + cz;
        const existing = renderList.get(key);
        if (existing) { existing.dispose(gl); renderList.delete(key); }
        const mesh = MC.buildMesh(world, cx, cz);
        const cr = new MC.ChunkRender(gl, mesh);
        renderList.set(key, cr);
        world.dirty.delete(key);
    };

    const markDirty = (cx, cz) => { toBuild.add(cx + "," + cz); };

    const processQueued = (limit) => {
        let n = 0;
        while (toBuild.size && n < limit) {
            const k = toBuild.values().next().value;
            toBuild.delete(k);
            const [cx, cz] = k.split(",").map(Number);
            meshChunk(cx, cz);
            n++;
        }
        return n;
    };

    // ----- draw helpers -----
    const bindVao = (prog, attrs) => {
        // attrs: array of {name,size,offset}
        const gl0 = gl;
        let stride = 0, offs = 0;
        for (const a of attrs) stride += a.size * 4;
        let o = 0;
        for (const a of attrs) {
            const loc = gl0.getAttribLocation(prog, a.name);
            if (loc < 0) continue;
            gl0.enableVertexAttribArray(loc);
            gl0.vertexAttribPointer(loc, a.size, gl0.FLOAT, false, stride, o);
            o += a.size * 4;
        }
    };

    const drawChunks = (viewM, projM, cam, fog, fogStart, fogEnd, isWaterPass) => {
        const gl0 = gl;
        gl0.useProgram(progBlock);
        gl0.activeTexture(gl0.TEXTURE0);
        gl0.bindTexture(gl0.TEXTURE_2D, MC.atlasTex);
        gl0.uniform1i(shadeAttribs.uTex, 0);
        gl0.uniformMatrix4fv(shadeAttribs.uView, false, viewM);
        gl0.uniformMatrix4fv(shadeAttribs.uProj, false, projM);
        gl0.uniform3f(shadeAttribs.uCam, cam[0], cam[1], cam[2]);
        gl0.uniform3f(shadeAttribs.uFog, fog[0], fog[1], fog[2]);
        gl0.uniform1f(shadeAttribs.uFogStart, fogStart);
        gl0.uniform1f(shadeAttribs.uFogEnd, fogEnd);
        const uWater = isWaterPass ? 1 : 0;
        gl0.uniform1f(shadeAttribs.uWater, uWater);

        if (isWaterPass) {
            gl0.enable(gl0.BLEND);
            gl0.blendFunc(gl0.SRC_ALPHA, gl0.ONE_MINUS_SRC_ALPHA);
        }

        for (const cr of renderList.values()) {
            for (const part of cr.list) {
                if (!!part.water !== isWaterPass) continue;
                gl0.bindBuffer(gl.ARRAY_BUFFER, part.vbo);
                const stride = 6 * 4;
                gl0.enableVertexAttribArray(shadeAttribs.aPos);
                gl0.vertexAttribPointer(shadeAttribs.aPos, 3, gl0.FLOAT, false, stride, 0);
                gl0.enableVertexAttribArray(shadeAttribs.aUV);
                gl0.vertexAttribPointer(shadeAttribs.aUV, 2, gl0.FLOAT, false, stride, 12);
                gl0.enableVertexAttribArray(shadeAttribs.aShade);
                gl0.vertexAttribPointer(shadeAttribs.aShade, 1, gl0.FLOAT, false, stride, 20);
                gl0.bindBuffer(gl0.ELEMENT_ARRAY_BUFFER, part.ibo);
                gl0.drawElements(gl0.TRIANGLES, part.idx, gl0.UNSIGNED_SHORT, 0);
            }
        }

        if (isWaterPass) gl0.disable(gl0.BLEND);
    };

    const drawSky = (viewM, projM, cam, sky) => {
        const gl0 = gl;
        setCanvas();
        view = viewM; proj = projM;
        // clear
        gl0.depthMask(true);
        gl0.clearColor(sky.horizon[0], sky.horizon[1], sky.horizon[2], 1);
        gl0.clear(gl0.DEPTH_BUFFER_BIT | gl0.COLOR_BUFFER_BIT);
        gl0.depthMask(false);

        // dome
        gl0.useProgram(progSky);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(progSky, "uView"), false, viewM);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(progSky, "uProj"), false, projM);
        // keep dome centered on camera: but uModel not present; we translate by camera in view? Instead pass uScale & use untranslated dirs — camera at origin sees full dome.
        gl0.uniform1f(gl0.getUniformLocation(progSky, "uScale"), 800);
        gl0.uniform3f(gl0.getUniformLocation(progSky, "uZenith"), sky.zenith[0], sky.zenith[1], sky.zenith[2]);
        gl0.uniform3f(gl0.getUniformLocation(progSky, "uHorizon"), sky.horizon[0], sky.horizon[1], sky.horizon[2]);
        gl0.uniform1f(gl0.getUniformLocation(progSky, "uSunFactor"), sky.sunFactor);
        gl0.bindBuffer(gl0.ARRAY_BUFFER, dome.verts);
        gl0.enableVertexAttribArray(gl0.getAttribLocation(progSky, "aDir"));
        gl0.vertexAttribPointer(gl0.getAttribLocation(progSky, "aDir"), 3, gl0.FLOAT, false, 0, 0);
        gl0.bindBuffer(gl0.ELEMENT_ARRAY_BUFFER, dome.idx);
        gl0.drawElements(gl0.TRIANGLES, dome.ic, gl0.UNSIGNED_SHORT, 0);

        // stars at night
        if (sky.starAlpha > 0.05) {
            gl0.useProgram(progStar);
            gl0.uniformMatrix4fv(gl0.getUniformLocation(progStar, "uView"), false, viewM);
            gl0.uniformMatrix4fv(gl0.getUniformLocation(progStar, "uProj"), false, projM);
            gl0.uniform1f(gl0.getUniformLocation(progStar, "uScale"), 790);
            gl0.uniform3f(gl0.getUniformLocation(progStar, "uColor"), 0.95, 0.97, 1.0);
            gl0.bindBuffer(gl0.ARRAY_BUFFER, starBuf.verts);
            gl0.enableVertexAttribArray(gl0.getAttribLocation(progStar, "aDir"));
            gl0.vertexAttribPointer(gl0.getAttribLocation(progStar, "aDir"), 3, gl0.FLOAT, false, 0, 0);
            gl0.bindBuffer(gl0.ARRAY_BUFFER, starBuf.sizes);
            gl0.enableVertexAttribArray(gl0.getAttribLocation(progStar, "aSize"));
            gl0.vertexAttribPointer(gl0.getAttribLocation(progStar, "aSize"), 1, gl0.FLOAT, false, 0, 0);
            gl0.drawArrays(gl0.POINTS, 0, starBuf.n);
        }

        // sun & moon billboards
        gl0.enable(gl0.BLEND);
        gl0.blendFunc(gl0.SRC_ALPHA, gl0.ONE_MINUS_SRC_ALPHA);
        drawBillboard(progBill, billTexs.sun, sky.sunPos, 90, [1, 1, 1], 0.9);
        if (sky.moonAlpha > 0.05) drawBillboard(progBill, billTexs.moon, sky.moonPos, 60, [1, 1, 1], sky.moonAlpha);
        gl0.disable(gl0.BLEND);
        gl0.depthMask(true);
    };

    const drawBillboard = (prog, tex, at, size, color, alpha) => {
        const gl0 = gl;
        const bl = size;
        if (!at) return;
        gl0.useProgram(prog);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(prog, "uView"), false, view);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(prog, "uProj"), false, proj);
        gl0.uniform3f(gl0.getUniformLocation(prog, "uAt"), at[0], at[1], at[2]);
        gl0.uniform1f(gl0.getUniformLocation(prog, "uSize"), bl);
        gl0.activeTexture(gl0.TEXTURE0);
        gl0.bindTexture(gl0.TEXTURE_2D, tex);
        gl0.uniform1i(gl0.getUniformLocation(prog, "uTex"), 0);
        gl0.uniform3f(gl0.getUniformLocation(prog, "uColor"), color[0], color[1], color[2]);
        gl0.uniform1f(gl0.getUniformLocation(prog, "uAlpha"), alpha);
        gl0.bindBuffer(gl0.ARRAY_BUFFER, quadUv);
        gl0.enableVertexAttribArray(gl0.getAttribLocation(prog, "aCorner"));
        gl0.vertexAttribPointer(gl0.getAttribLocation(prog, "aCorner"), 2, gl0.FLOAT, false, 0, 0);
        gl0.bindBuffer(gl0.ELEMENT_ARRAY_BUFFER, quadIdxBuf);
        gl0.drawElements(gl0.TRIANGLES, 6, gl0.UNSIGNED_SHORT, 0);
    };

    const drawClouds = (viewM, projM, fog, t, cloudHeight) => {
        const gl0 = gl;
        gl0.enable(gl0.BLEND);
        gl0.blendFunc(gl0.SRC_ALPHA, gl0.ONE_MINUS_SRC_ALPHA);
        gl0.useProgram(progCloud);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(progCloud, "uView"), false, viewM);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(progCloud, "uProj"), false, projM);
        gl0.activeTexture(gl0.TEXTURE0);
        gl0.bindTexture(gl0.TEXTURE_2D, cloudTex);
        gl0.uniform1i(gl0.getUniformLocation(progCloud, "uTex"), 0);
        gl0.uniform3f(gl0.getUniformLocation(progCloud, "uFog"), fog[0], fog[1], fog[2]);
        gl0.uniform1f(gl0.getUniformLocation(progCloud, "uSize"), 320);
        gl0.uniform1f(gl0.getUniformLocation(progCloud, "uScroll"), t * 0.8);
        gl0.uniform3f(gl0.getUniformLocation(progCloud, "uCenter"), MC.playerPos[0], cloudHeight, MC.playerPos[2]);
        gl0.depthMask(false);
        gl0.bindBuffer(gl0.ARRAY_BUFFER, quadUv);
        gl0.enableVertexAttribArray(gl0.getAttribLocation(progCloud, "aCorner"));
        gl0.vertexAttribPointer(gl0.getAttribLocation(progCloud, "aCorner"), 2, gl0.FLOAT, false, 0, 0);
        gl0.bindBuffer(gl0.ELEMENT_ARRAY_BUFFER, quadIdxBuf);
        gl0.drawElements(gl0.TRIANGLES, 6, gl0.UNSIGNED_SHORT, 0);
        // second layer
        gl0.uniform1f(gl0.getUniformLocation(progCloud, "uScroll"), -t * 0.5 + 17);
        gl0.uniform3f(gl0.getUniformLocation(progCloud, "uCenter"), MC.playerPos[0] + 90, cloudHeight + 2, MC.playerPos[2] + 70);
        gl0.drawElements(gl0.TRIANGLES, 6, gl0.UNSIGNED_SHORT, 0);
        gl0.depthMask(true);
        gl0.disable(gl0.BLEND);
    };

    // mob skinning & unit cube (used by part 4)
    var viewM = null, projM = null, fogC = [0,0,0];
    MC.setWorldMatrix = (v, p, f) => { viewM = v; projM = p; if (f) fogC = f; };

    MC.getMobState = () => ({ progUni, gl, atlasTex: MC.atlasTex, viewM, projM, fogC });

    MC.buildUnitCube = (gl0) => {
        if (MC.unitCubeData) return MC.unitCubeData;
        // centered unit cube boxes with per-face flat colors via one atlas tile
        const v = [];
        const addFace = (a,b,c,d,e,f,g,h) => {
            for (const [x,y,z,u,w] of [a,b,c,d,e,f,g,h]) {
                v.push(x, y, z, u, w);
            }
        };
        const t0=[0,0], t1=[1,0], t2=[1,1], t3=[0,1];
        // +Y
        addFace([0,1,0,t0[0],t0[1]],[1,1,0,t1[0],t1[1]],[1,1,1,t2[0],t2[1]],[0,1,1,t3[0],t3[1]]);
        addFace([0,1,1,t3[0],t3[1]],[1,1,1,t2[0],t2[1]],[1,1,0,t1[0],t1[1]],[0,1,0,t0[0],t0[1]]);
        // -Y
        addFace([0,0,0,t0[0],t0[1]],[1,0,0,t1[0],t1[1]],[1,0,1,t2[0],t2[1]],[0,0,1,t3[0],t3[1]]);
        addFace([0,0,1,t3[0],t3[1]],[1,0,1,t2[0],t2[1]],[1,0,0,t1[0],t1[1]],[0,0,0,t0[0],t0[1]]);
        // +X
        addFace([1,0,0,t0[0],t1[1]],[1,1,0,t0[0],t0[1]],[1,1,1,t1[0],t0[1]],[1,0,1,t1[0],t1[1]]);
        addFace([1,0,1,t1[0],t1[1]],[1,1,1,t1[0],t0[1]],[1,1,0,t0[0],t0[1]],[1,0,0,t0[0],t1[1]]);
        // -X
        addFace([0,0,1,t0[0],t1[1]],[0,1,1,t0[0],t0[1]],[0,1,0,t1[0],t0[1]],[0,0,0,t1[0],t1[1]]);
        addFace([0,0,0,t1[0],t1[1]],[0,1,0,t1[0],t0[1]],[0,1,1,t0[0],t0[1]],[0,0,1,t0[0],t1[1]]);
        // +Z
        addFace([0,0,1,t0[0],t1[1]],[1,0,1,t1[0],t1[1]],[1,1,1,t1[0],t0[1]],[0,1,1,t0[0],t0[1]]);
        addFace([0,1,1,t0[0],t0[1]],[1,1,1,t1[0],t0[1]],[1,0,1,t1[0],t1[1]],[0,0,1,t0[0],t1[1]]);
        // -Z
        addFace([0,0,0,t1[0],t1[1]],[1,0,0,t0[0],t1[1]],[1,1,0,t0[0],t0[1]],[0,1,0,t1[0],t0[1]]);
        addFace([0,1,0,t1[0],t0[1]],[1,1,0,t0[0],t0[1]],[1,0,0,t0[0],t1[1]],[0,0,0,t1[0],t1[1]]);

        const idx = [];
        for (let i = 0; i < v.length / 5; i += 4) {
            idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
        }
        const vb = gl0.createBuffer();
        gl0.bindBuffer(gl0.ARRAY_BUFFER, vb);
        gl0.bufferData(gl0.ARRAY_BUFFER, new Float32Array(v), gl0.STATIC_DRAW);
        const ib = gl0.createBuffer();
        gl0.bindBuffer(gl0.ELEMENT_ARRAY_BUFFER, ib);
        gl0.bufferData(gl0.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl0.STATIC_DRAW);
        const cubeData = { vb, ib, idx: idx.length, count: v.length / 5 };
        MC.unitCubeData = cubeData;
        return cubeData;
    };

    MC.drawBox = (modelM, color, tileName, scale) => {
        const { progUni, gl: gl0, atlasTex } = MC.getMobState();
        if (!viewM || !progUni) return;
        gl0.useProgram(progUni);
        gl0.activeTexture(gl0.TEXTURE0);
        gl0.bindTexture(gl0.TEXTURE_2D, atlasTex);
        gl0.uniform1i(gl0.getUniformLocation(progUni, "uTex"), 0);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(progUni, "uView"), false, viewM);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(progUni, "uProj"), false, projM);
        gl0.uniformMatrix4fv(gl0.getUniformLocation(progUni, "uModel"), false, modelM);
        if (color) gl0.uniform3f(gl0.getUniformLocation(progUni, "uColor"), color[0], color[1], color[2]);
        else gl0.uniform3f(gl0.getUniformLocation(progUni, "uColor"), 1, 1, 1);
        const cube = MC.unitCubeData || MC.buildUnitCube(gl0);
        gl0.bindBuffer(gl0.ARRAY_BUFFER, cube.vb);
        gl0.enableVertexAttribArray(gl0.getAttribLocation(progUni, "aPos"));
        gl0.vertexAttribPointer(gl0.getAttribLocation(progUni, "aPos"), 3, gl0.FLOAT, false, 20, 0);
        gl0.enableVertexAttribArray(gl0.getAttribLocation(progUni, "aUV"));
        gl0.vertexAttribPointer(gl0.getAttribLocation(progUni, "aUV"), 2, gl0.FLOAT, false, 20, 12);
        gl0.bindBuffer(gl0.ELEMENT_ARRAY_BUFFER, cube.ib);
        gl0.drawElements(gl0.TRIANGLES, cube.idx, gl0.UNSIGNED_SHORT, 0);
    };

    MC.renderMob = (mob, world) => {
    // body box (grounded at mob.y)
    MC.mat4.identity(MC.modelMat);
    MC.mat4.translate(MC.modelMat, MC.modelMat, [mob.x, mob.y - 0.4, mob.z]);
    MC.mat4.rotateY(MC.modelMat, MC.modelMat, mob.facing);
    MC.mat4.scale(MC.modelMat, MC.modelMat, [mob.scale, mob.scale, mob.scale]);
    MC.drawBox(MC.modelMat, mob.body, null);
    // head (higher, slightly larger)
    MC.mat4.identity(MC.modelMat);
    MC.mat4.translate(MC.modelMat, MC.modelMat, [mob.x, mob.y + mob.scale * 0.35, mob.z]);
    MC.mat4.scale(MC.modelMat, MC.modelMat, [mob.scale * 1.15, mob.scale * 0.55, mob.scale * 1.15]);
    MC.drawBox(MC.modelMat, mob.head, null);
    // legs
    const swing = Math.sin(mob.legPhase);
    const lift = Math.max(0, swing) * mob.walkCycle * 0.3;
    for (let i = 0; i < 4; i++) {
        const lx = (i % 2 ? 0.26 : -0.26) * mob.scale;
        const lz = (i < 2 ? 0.22 : -0.22) * mob.scale;
        MC.mat4.identity(MC.modelMat);
        MC.mat4.translate(MC.modelMat, MC.modelMat, [mob.x + lx, mob.y - 0.35 + (i % 2 ? lift : -lift), mob.z + lz]);
        MC.mat4.scale(MC.modelMat, MC.modelMat, [mob.scale * 0.4, mob.scale * 0.55, mob.scale * 0.4]);
        MC.drawBox(MC.modelMat, mob.leg, null);
    }
};

    return {
        init,
        setCanvas,
        setWorld,
        meshChunk,
        markDirty,
        processQueued,
        hasChunk: (wx, wz) => renderList.has(wx + "," + wz),
        drawSky,
        drawChunks,
        drawClouds,
        drawBillboard,
        get remainingQueued() { return toBuild.size; },
        get shader() { return shadeAttribs; },
        get programBlock() { return progBlock; },
        get gl() { return gl; },
        get proj() { return proj; },
        get view() { return view; },
    };
})();

// [08-PART4]

/* =========================================================
   04 · INPUT
   ======================================================== */
MC.input = {
    keys: new Set(),
    mouseDX: 0, mouseDY: 0,
    mousedown: 0, // bits: 1=left, 2=right, 4=middle
    locked: false,
};

/* =========================================================
   04 · PLAYER & PHYSICS
   ======================================================== */
MC.playerPos = [0, 80, 0]; // shared ref for sky/cloud positioning (x,y,z)

MC.PW = 0.6;        // player horizontal size
MC.PH = 1.8;        // player height
MC.EYE = 1.62;      // eye height
MC.GRAV = 32;
MC.JUMP = 8.6;
MC.WALK = 4.3;
MC.SPRINT = 5.7;
MC.FLY = 10.5;

MC.Player = function () {
    this.pos = [8, 90, 8];
    this.vel = [0, 0, 0];
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.mode = "creative";
    this.hp = 20;
    this.hunger = 20;
    this.flying = false;
    this.sneaking = false;
    this.swimming = false;
    this.inventory = new Array(36).fill(0).map(() => ({ id: 0, count: 0 }));
    this.hotbarSlot = 0;
    this.time = 9000;         // start morning
    this.hurtTimer = 0;
    this.breakProgress = 0;
    this.breakTarget = null;
    this.spawn = null;
    this.interactCooldown = 0;
    this.ticksOnSurface = 0;
    this.timer = 0;
    this.fallStart = null;
    this.spawnY = 96;
};
MC.Player.prototype = {
    getHeld() { return this.inventory[this.hotbarSlot]; },
    addItem(id, count) {
        count = count || 1;
        // stack existing
        for (let i = 0; i < 36; i++) {
            const sl = this.inventory[i];
            if (sl.id === id && (sl.count + count) <= 64) {
                sl.count += count;
                return true;
            }
        }
        for (let i = 0; i < 36; i++) {
            const sl = this.inventory[i];
            if (sl.id === 0) {
                sl.id = id; sl.count = Math.min(count, 64);
                return count <= 64;
            }
        }
        return false;
    },
    removeItem(slot, count) {
        const sl = this.inventory[slot];
        if (!sl || sl.id === 0) return false;
        const take = Math.min(sl.count, count);
        sl.count -= take;
        if (sl.count <= 0) { sl.id = 0; sl.count = 0; }
        return true;
    },
    countItem(id) {
        let c = 0;
        for (let i = 0; i < 36; i++) if (this.inventory[i].id === id) c += this.inventory[i].count;
        return c;
    },
    consumeItem(id, count) {
        let need = count;
        for (let i = 0; i < 36 && need > 0; i++) {
            const sl = this.inventory[i];
            if (sl.id === id) {
                const take = Math.min(sl.count, need);
                sl.count -= take; need -= take;
                if (sl.count <= 0) { sl.id = 0; sl.count = 0; }
            }
        }
        return need === 0;
    },
};

MC.findEntitySpawn = function (player) {
    // nearest safe ground within radius starting from player col
    const gx = Math.floor(player.pos[0]), gz = Math.floor(player.pos[2]);
    for (let r = 4; r < 40; r++) {
        for (let i = 0; i < 24; i++) {
            const t = (i / 24) * Math.PI * 2 + (r % 2) * 2;
            const px = gx + Math.floor(Math.cos(t) * r), pz = gz + Math.floor(Math.sin(t) * r);
            const h = MC.world.hAt(px, pz);
            if (h <= MC.WATER + 1) continue;
            const b = MC.world.getBlock(px, h + 1, pz);
            const b2 = MC.world.getBlock(px, h + 2, pz);
            if (b === 0 && b2 === 0) return { x: px + 0.5, y: h + 1, z: pz + 0.5 };
        }
    }
    return null;
};


/* =========================================================
   04 · VOXEL RAYCAST
   ======================================================== */
MC.raycast = (origin, dir, maxDist) => {
    // returns {x,y,z,nx,ny,nz,id} or null
    let x = Math.floor(origin[0]), y = Math.floor(origin[1]), z = Math.floor(origin[2]);
    const stepX = dir[0] > 0 ? 1 : -1, stepY = dir[1] > 0 ? 1 : -1, stepZ = dir[2] > 0 ? 1 : -1;
    const tDeltaX = Math.abs(1 / (dir[0] || 1e-9));
    const tDeltaY = Math.abs(1 / (dir[1] || 1e-9));
    const tDeltaZ = Math.abs(1 / (dir[2] || 1e-9));
    let tMaxX = ((dir[0] > 0 ? (x + 1 - origin[0]) : (origin[0] - x)) * tDeltaX);
    let tMaxY = ((dir[1] > 0 ? (y + 1 - origin[1]) : (origin[1] - y)) * tDeltaY);
    let tMaxZ = ((dir[2] > 0 ? (z + 1 - origin[2]) : (origin[2] - z)) * tDeltaZ);
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < 256; i++) {
        const id = MC.world.getBlock(x, y, z);
        if (id !== 0 && !BLOCKS[id].water && !BLOCKS[id].transparent) {
            return { x, y, z, nx, ny, nz, id };
        }
        if (id !== 0 && BLOCKS[id].transparent && !BLOCKS[id].water && !BLOCKS[id].leavesLike) {
            // glass: still targetable
            return { x, y, z, nx, ny, nz, id };
        }
        if (tMaxX < tMaxY && tMaxX < tMaxZ) {
            if (tMaxX > maxDist) return null;
            x += stepX; tMaxX += tDeltaX;
            nx = -stepX; ny = 0; nz = 0;
        } else if (tMaxY < tMaxZ) {
            if (tMaxY > maxDist) return null;
            y += stepY; tMaxY += tDeltaY;
            nx = 0; ny = -stepY; nz = 0;
        } else {
            if (tMaxZ > maxDist) return null;
            z += stepZ; tMaxZ += tDeltaZ;
            nx = 0; ny = 0; nz = -stepZ;
        }
    }
    return null;
};


/* =========================================================
   04 · TIME & SKY
   ======================================================== */
MC.dayLength = 24000;
MC.timeToAngle = t => ((t - 6000) / 12000) * Math.PI; // 6000=noon; 0 = midnight? noon angle=0 → sun straight up

MC.skyState = (t) => {
    const phase = (t % MC.dayLength) / MC.dayLength; // 0..1
    // sun rises at phase 0 (6:00), zenith at phase 0.25 (noon), sets at phase 0.5
    const ang = phase * Math.PI * 2;
    const sunX = Math.cos(ang) * 500, sunY = Math.sin(ang) * 500, sunZ = Math.sin(ang) * 200 - 100;
    const daylight = MC.clamp(Math.sin(ang) * 1.6, 0, 1);
    const dusk = MC.clamp(1 - Math.abs(Math.sin(ang)) * 6, 0, 1) * MC.clamp(Math.abs(Math.sin(ang)) * 3, 0, 1) * 0.6;
    // night factor
    const night = 1 - daylight;

    const dayZ = [108, 170, 228];
    const nightZ = [14, 18, 44];
    const dayH = [196, 212, 230];
    const nightH = [30, 34, 60];
    const zenith = [
        MC.lerp(nightZ[0], dayZ[0], daylight) + dusk * 60,
        MC.lerp(nightZ[1], dayZ[1], daylight) + dusk * 30,
        MC.lerp(nightZ[2], dayZ[2], daylight) + dusk * 0,
    ];
    const horizon = [
        MC.lerp(nightH[0], dayH[0], daylight) + dusk * 90,
        MC.lerp(nightH[1], dayH[1], daylight) + dusk * 60,
        MC.lerp(nightH[2], dayH[2], daylight) + dusk * 20,
    ];
    const sunFactor = daylight;
    const starAlpha = MC.clamp(night * 1.8, 0, 1);
    // moon opposite
    const moonAng = ang + Math.PI;
    const moonX = Math.cos(moonAng) * 500, moonY = Math.sin(moonAng) * 500, moonZ = Math.sin(moonAng) * 200 - 100;

    // NOTE: WebGL wants colors in 0..1; convert the 0..255 palettes here.
    const n1 = (c) => c / 255;
    return {
        daylight, dusk, night, starAlpha, sunFactor,
        zenith: [n1(zenith[0]), n1(zenith[1]), n1(zenith[2])],
        horizon: [n1(horizon[0]), n1(horizon[1]), n1(horizon[2])],
        sunPos: [sunX, sunY, sunZ],
        moonPos: moonY > -50 ? [moonX, moonY, moonZ] : null,
        moonAlpha: night,
        fog: [
            n1(MC.lerp(30, 200, daylight) + dusk * 140),
            n1(MC.lerp(34, 216, daylight) + dusk * 90),
            n1(MC.lerp(58, 228, daylight) + dusk * 40),
        ],
    };
};


/* =========================================================
   04 · EXPLOSION & TNT
   ======================================================== */
MC.explode = (x, y, z, radius) => {
    const r = radius || 4;
    MC.sfx.explosion();
    MC.state.cameraShake = Math.min(1, r / 4);
    const w = MC.world;
    const R2 = (r + 0.5) * (r + 0.5);
    for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dz = -r; dz <= r; dz++) {
                const d2 = dx * dx + dy * dy + dz * dz;
                if (d2 > R2) continue;
                const bx = x + dx, by = y + dy, bz = z + dz;
                if (by < 0 || by >= MC.WH) continue;
                const id = w.getBlock(bx, by, bz);
                if (id === 0 || id === B_BEDROCK) continue;
                if (id === B_TNT) { w.setBlock(bx, by, bz, 0); MC.fuseTNT(bx, by, bz, 1.5 + Math.random() * 0.4); continue; }
                w.setBlock(bx, by, bz, 0);
                MC.spawnParticles(bx + 0.5, by + 0.5, bz + 0.5, [180, 180, 180], 3);
            }
        }
    }
    // damage player
    const p = MC.player;
    if (p && p.mode !== "creative") {
        const d = Math.hypot(p.pos[0] - x - 0.5, p.pos[1] - y - 0.5, p.pos[2] - z - 0.5);
        if (d < r + 2) p.damage(Math.min(17, Math.max(2, Math.round((r + 2 - d) * 6))));
    }
    // damage mobs
    for (const m of MC.mobs) {
        const d = Math.hypot(m.x - x - 0.5, m.y - y - 0.5, m.z - z - 0.5);
        if (d < r + 2) m.hp -= Math.min(16, Math.max(3, Math.round((r + 2 - d) * 7)));
    }
};

MC.fuses = [];
MC.fuseTNT = (x, y, z, delay) => {
    delay = delay === undefined ? 3 : delay;
    MC.fuses.push({ x, y, z, t: delay });
    MC.sfx.fuse();
};

MC.tickFuses = (dt) => {
    for (let i = MC.fuses.length - 1; i >= 0; i--) {
        const f = MC.fuses[i];
        f.t -= dt;
        if (f.t <= 0) {
            MC.fuses.splice(i, 1);
            // light emissive actor visuals omitted; re-fetch block (may have been replaced)
            if (MC.world.getBlock(f.x, f.y, f.z) === B_TNT)
                MC.explode(f.x, f.y, f.z, 4);
        }
    }
};

MC.ignite = function (bx, by, bz) {
    if (MC.world.getBlock(bx, by, bz) === B_TNT) {
        MC.fuseTNT(bx, by, bz, 3);
        return true;
    }
    return false;
};

MC.particles = [];
MC.spawnParticles = (x, y, z, color, n) => {
    for (let i = 0; i < (n || 8); i++) {
        MC.particles.push({
            x, y, z,
            vx: (Math.random() - 0.5) * 5,
            vy: Math.random() * 4 + 1,
            vz: (Math.random() - 0.5) * 5,
            life: 0.5 + Math.random() * 0.5,
            c: color || [255, 255, 255],
            size: 0.08 + Math.random() * 0.1,
        });
    }
};
MC.tickParticles = (dt) => {
    for (let i = MC.particles.length - 1; i >= 0; i--) {
        const p = MC.particles[i];
        p.life -= dt;
        if (p.life <= 0) { MC.particles.splice(i, 1); continue; }
        p.vy -= 12 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    }
};


/* =========================================================
   04 · MOBS
   ======================================================== */
MC.mobs = [];
MC.mobDefs = {
    pig:   { body: [235, 150, 160], head: [235, 150, 160], leg: [210, 120, 130], hp: 10 },
    cow:   { body: [230, 210, 190], head: [230, 210, 190], leg: [230, 210, 190], hp: 14 },
    sheep: { body: [235, 230, 220], head: [235, 230, 220], leg: [235, 230, 220], hp: 9 },
};

MC.spawnMob = (type, px, py, pz) => {
    const def = MC.mobDefs[type] || MC.mobDefs.pig;
    const scale = 0.85 + Math.random() * 0.3;
    MC.mobs.push({
        type, def, scale,
        x: px, y: py, z: pz,
        baseY: py,
        vy: 0,
        hp: def.hp,
        onGround: false,
        facing: Math.random() * Math.PI * 2,
        body: def.body, head: def.head, leg: def.leg,
        wanderT: 0, wanderDx: 0, wanderDz: 0,
        walkCycle: 0, legPhase: Math.random() * 3,
        timer: Math.random() * 100,
        bobPhase: Math.random() * 3,
        dead: false,
    });
};

MC.tickMobs = (dt, player) => {
    const w = MC.world;
    for (let i = MC.mobs.length - 1; i >= 0; i--) {
        const m = MC.mobs[i];
        if (m.hp <= 0 || m.dead) { MC.mobs.splice(i, 1); continue; }
        m.timer -= dt;
        m.wanderT -= dt;
        if (m.wanderT <= 0) {
            m.wanderT = 2 + Math.random() * 4;
            m.wanderDx = (Math.random() - 0.5) * 6;
            m.wanderDz = (Math.random() - 0.5) * 6;
        }
        const h = w.hAt(Math.floor(m.x), Math.floor(m.z));
        // gravity
        m.vy -= 22 * dt;
        m.vy = Math.max(m.vy, -25);
        m.y += m.vy * dt;

        // horizontal wander
        if (m.onGround) {
            m.x += m.wanderDx * dt;
            m.z += m.wanderDz * dt;
            m.walkCycle += Math.min(1, Math.abs(m.wanderDx) + Math.abs(m.wanderDz)) * dt * 9;
            m.facing = Math.atan2(m.wanderDx, m.wanderDz);
        }
        // ground clamp on solid block below
        const gx = Math.floor(m.x), gy = Math.floor(m.y), gz = Math.floor(m.z);
        const below = w.getBlock(gx, gy - 1, gz);
        const solid = below !== 0 && !BLOCKS[below].water;
        if (m.y < gy + 1 && solid && m.vy <= 0) {
            m.y = gy + 0.5;
            m.vy = 0;
            m.onGround = true;
        } else m.onGround = false;

        // water push
        if (!player) continue;
        // despawn if far
        const dx = m.x - player.pos[0], dz = m.z - player.pos[2];
        if (dx * dx + dz * dz > 512 * 512) { m.hp = 0; }
    }
    // feed cap
    if (MC.mobs.length < 20 && Math.random() < dt * 0.6) {
        const sp = MC.findEntitySpawn(player);
        if (sp) {
            const types = ["pig", "cow", "sheep"];
            MC.spawnMob(types[(Math.random() * types.length) | 0], sp.x, sp.y, sp.z);
        }
    }
};


/* =========================================================
   04 · PLAYER UPDATE
   ======================================================== */
MC.Player.prototype.damage = function (n) {
    if (this.mode === "creative") return;
    this.hp = Math.max(0, this.hp - n);
    this.hurtTimer = 0.5;
    MC.sfx.hurt();
    if (this.hp <= 0) MC.onPlayerDeath();
};

MC.dirFromAngles = function (yaw, pitch) {
    const cp = Math.cos(pitch);
    return [-cp * Math.sin(yaw), Math.sin(pitch), -cp * Math.cos(yaw)];
};

MC.Player.prototype.collides = function (x, y, z, w2, h2) {
    const r = w2 / 2;
    const x0 = Math.floor(x - r), x1 = Math.floor(x + r);
    const y0 = Math.floor(y), y1 = Math.floor(y + h2);
    const z0 = Math.floor(z - r), z1 = Math.floor(z + r);
    for (let qx = x0; qx <= x1; qx++) {
        for (let qy = y0; qy <= y1; qy++) {
            for (let qz = z0; qz <= z1; qz++) {
                const id = MC.world.getBlock(qx, qy, qz);
                if (id !== 0 && !BLOCKS[id].water) return true;
            }
        }
    }
    return false;
};

MC.Player.prototype.moveAxis = function (dx, dy, dz) {
    // move with collision (axis separated)
    if (dx !== 0) {
        this.pos[0] += dx;
        if (this.collides(this.pos[0], this.pos[1], this.pos[2], MC.PW, MC.PH)) {
            this.pos[0] -= dx;
        }
    }
    if (dy !== 0) {
        this.pos[1] += dy;
        if (this.collides(this.pos[0], this.pos[1], this.pos[2], MC.PW, MC.PH)) {
            if (dy < 0) this.onGround = true;
            this.vel[1] = 0;
            this.pos[1] -= dy;
        }
    }
    if (dz !== 0) {
        this.pos[2] += dz;
        if (this.collides(this.pos[0], this.pos[1], this.pos[2], MC.PW, MC.PH)) {
            this.pos[2] -= dz;
        }
    }
};

MC.Player.prototype.update = function (dt) {
    const inp = MC.input;
    const keys = inp.keys;
    const p = this;

    // water state
    const blockAtEye = MC.world.getBlock(Math.floor(p.pos[0]), Math.floor(p.pos[1] + 0.3), Math.floor(p.pos[2]));
    p.swimming = blockAtEye === B_WATER;
    const blockAtFeet = MC.world.getBlock(Math.floor(p.pos[0]), Math.floor(p.pos[1]), Math.floor(p.pos[2]));
    const feetInWater = blockAtFeet === B_WATER;

    // movement dirs (forward/strafe from camera yaw)
    const w = keys.has("KeyW"), s = keys.has("KeyS"), a = keys.has("KeyA"), d = keys.has("KeyD");
    const fy = (w ? 1 : 0) - (s ? 1 : 0);      // +1 forward
    const rx = (d ? 1 : 0) - (a ? 1 : 0);      // +1 right
    // horizontal camera basis (yaw only)
    const fxw = -Math.sin(p.yaw), fzw = -Math.cos(p.yaw);
    const rxv = fzw, rzv = -fxw;
    let walkX = fy * fxw + rx * rxv;
    let walkZ = fy * fzw + rx * rzv;
    const wl = Math.hypot(walkX, walkZ);
    if (wl > 0) { walkX /= wl; walkZ /= wl; }

    const sprint = keys.has("ControlLeft") || keys.has("ControlRight");
    let targetSpeed = (p.mode === "creative" || p.swimming) ? (sprint ? 7 : 4) : (sprint ? MC.SPRINT : MC.WALK);
    p.sneaking = keys.has("ShiftLeft") && !p.flying && p.mode !== "creative";
    if (p.sneaking) targetSpeed *= 0.45;

    if (p.mode === "creative" && p.flying) {
        const fly = keys.has("Space") ? 1 : 0;
        const down = keys.has("ShiftLeft") ? -1 : 0;
        p.vel[1] = MC.lerp(p.vel[1], (fly + down) * MC.FLY, 0.3);
        targetSpeed = MC.FLY;
    } else if (p.swimming) {
        if (keys.has("Space")) p.vel[1] += 24 * dt;
        else if (keys.has("ShiftLeft")) p.vel[1] -= 9 * dt;
        p.vel[1] = MC.lerp(p.vel[1], 0, (keys.has("Space") || keys.has("ShiftLeft")) ? 0 : 0.02);
    } else {
        if (p.onGround && keys.has("Space")) {
            p.vel[1] = MC.JUMP;
            p.onGround = false;
            MC.sfx.jump();
        }
        if (p.onGround) {
            // friction
            p.vel[0] *= Math.pow(0.0001, dt);
            p.vel[2] *= Math.pow(0.0001, dt);
        } else {
            p.vel[0] *= Math.pow(0.6, dt);
            p.vel[2] *= Math.pow(0.6, dt);
        }
    }
    if (!(p.mode === "creative" && p.flying) && !p.swimming) {
        p.vel[1] = Math.max(p.vel[1] - MC.GRAV * dt, -70);
    }
    // accelerate toward target walk velocity
    const accel = p.onGround ? 15 : 5;
    const targetX = walkX * targetSpeed;
    const targetZ = walkZ * targetSpeed;
    p.vel[0] = MC.lerp(p.vel[0], targetX, 1 - Math.exp(-accel * dt));
    p.vel[2] = MC.lerp(p.vel[2], targetZ, 1 - Math.exp(-accel * dt));

    // move
    p.onGround = false;
    p.moveAxis(p.vel[0] * dt, 0, 0);
    p.moveAxis(0, p.vel[1] * dt, 0);
    p.moveAxis(0, 0, p.vel[2] * dt);

    // fall damage
    if (p.onGround && p.fallStart !== null) {
        const f = p.fallStart - p.pos[1];
        if (f > 3.5) p.damage(Math.round((f - 3) * 2));
        p.fallStart = null;
    }
    if (!p.onGround && p.fallStart === null) p.fallStart = p.pos[1];
    if (p.onGround) p.fallStart = null;

    // hunger / health
    if (p.mode === "survival") {
        if (sprint && (w || a || s || d)) p.hunger = Math.max(0, p.hunger - 0.16 * dt);
        else p.hunger = Math.min(20, p.hunger + 0.02 * dt);
        p.healTimer = (p.healTimer || 0) + dt;
        if (p.hunger > 17 && p.healTimer > 4.2) { p.healTimer = 0; p.hp = Math.min(20, p.hp + 1); }
        p.starveTimer = (p.starveTimer || 0) + dt;
        if (p.hunger < 4 && p.starveTimer > 4) { p.starveTimer = 0; p.damage(2); }
    }
    if (p.hurtTimer > 0) p.hurtTimer -= dt;

    // keep in bounds + fall into void
    if (p.pos[1] < -20) {
        p.pos[1] = p.spawnY !== undefined ? p.spawnY : 90;
        p.vel[1] = 0;
        p.damage(50);
    }

    MC.playerPos[0] = p.pos[0]; MC.playerPos[1] = p.pos[1]; MC.playerPos[2] = p.pos[2];

    // mouse look (applied at input consume)
};

MC.pLoaded = false;

/* =========================================================
   04 · INTERACTION
   ======================================================== */
MC.pointReach = { creative: 6, survival: 4.5 };

MC.playerBreakBlock = function (p, hit) {
    const id = MC.world.getBlock(hit.x, hit.y, hit.z);
    if (id === B_BEDROCK) return;
    if (id === B_TNT) { MC.ignite(hit.x, hit.y, hit.z); return; }
    const bl = BLOCKS[id];
    const tool = MC.toolKind(p.getHeld().id);
    const tier = MC.toolTier(p.getHeld().id);
    if (bl.mineTier && tier < bl.mineTier) {
        // too hard
        MC.spawnParticles(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5, [120, 120, 120], 6);
        MC.sfx.breakBlock();
        return;
    }
    if (p.mode === "creative") {
        MC.setBlockWithDrops(hit.x, hit.y, hit.z, 0, p);
        MC.sfx.breakBlock();
        return;
    }
    // survival timed break
    if (p.breakTarget && p.breakTarget.x === hit.x && p.breakTarget.y === hit.y && p.breakTarget.z === hit.z) {
        p.breakProgress += (MC.dtLast || 0.02);
        const hardness = bl.hardness || 0.5;
        let speed = 1;
        if (tool === bl.tool) speed = 2.4 + tier * 1.2;
        else if (bl.tool && tool !== "hand") speed = 0.5;
        const total = hardness * 1.7 / speed;
        if (p.breakProgress >= total) {
            MC.setBlockWithDrops(hit.x, hit.y, hit.z, 0, p);
            p.breakProgress = 0;
            p.breakTarget = null;
            MC.sfx.breakBlock();
        } else {
            MC.spawnParticles(hit.x + Math.random(), hit.y + 0.5, hit.z + Math.random(), [150, 150, 150], 2);
        }
    } else {
        p.breakTarget = { x: hit.x, y: hit.y, z: hit.z };
        p.breakProgress = 0.0001;
    }
};

MC.setBlockWithDrops = function (x, y, z, id, p) {
    const old = MC.world.getBlock(x, y, z);
    MC.world.setBlock(x, y, z, id);
    MC.gfx.markDirty(x >> 4, z >> 4);
    if (old && id === 0) {
        const bl = BLOCKS[old];
        let dropId = old, dropCount = 1;
        if (bl.drop !== undefined && bl.drop !== 0 && bl.drop !== old) dropId = bl.drop;
        else if (bl.drop === 0 && bl.hardness >= 0) dropId = 0;
        if (old === B_LEAVES && Math.random() < 0.08) { dropId = I_STICK; }
        if (dropId > 0) {
            // try direct pickup 50/50, else drop entity
            if (Math.random() < 0.55 || !MC.spawnItemEntity(x, y, z, dropId, dropCount)) {
                p.addItem(dropId, dropCount);
            }
        }
    }
};

MC.itemEntities = [];
MC.spawnItemEntity = function (bx, by, bz, id, count) {
    if (MC.itemEntities.length > 120) return false;
    MC.itemEntities.push({
        x: bx + 0.5, y: by + 0.5, z: bz + 0.5, vy: 2,
        vx: (Math.random() - 0.5) * 2, vz: (Math.random() - 0.5) * 2,
        id, count, age: 0,
    });
    return true;
};
MC.tickItemEntities = function (dt, p) {
    for (let i = MC.itemEntities.length - 1; i >= 0; i--) {
        const it = MC.itemEntities[i];
        it.age += dt;
        it.vy -= 16 * dt;
        it.x += it.vx * dt; it.y += it.vy * dt; it.z += it.vz * dt;
        const b = MC.world.getBlock(Math.floor(it.x), Math.floor(it.y), Math.floor(it.z));
        if (b !== 0 && !BLOCKS[b].water) {
            it.y = Math.floor(it.y) + 1.05; it.vy = 0;
        }
        const d = Math.hypot(it.x - p.pos[0], it.y - p.pos[1] - 1, it.z - p.pos[2]);
        if (d < 1.6 && it.age > 0.2) {
            MC.sfx.pickup();
            p.addItem(it.id, it.count);
            MC.itemEntities.splice(i, 1);
            continue;
        }
        if (it.age > 300) MC.itemEntities.splice(i, 1);
    }
};

MC.placeSelected = function (p, hit, id) {
    const px = hit.x + hit.nx, py = hit.y + hit.ny, pz = hit.z + hit.nz;
    if (py < 0 || py >= MC.WH) return;
    // don't place into a solid
    const cur = MC.world.getBlock(px, py, pz);
    if (cur !== 0 && !BLOCKS[cur].water) return;
    // don't place inside player
    const r = MC.PW / 2 + 0.02;
    if (px + 1 > p.pos[0] - r && px < p.pos[0] + r &&
        pz + 1 > p.pos[2] - r && pz < p.pos[2] + r &&
        py + 1 > p.pos[1] && py < p.pos[1] + MC.PH) return;
    MC.world.setBlock(px, py, pz, id);
    MC.gfx.markDirty(px >> 4, pz >> 4);
    MC.sfx.placeBlock();
    if (!p.mode) p.removeItem(p.hotbarSlot, 1);
    if (p.mode === "survival") p.removeItem(p.hotbarSlot, 1);
};

MC.itemColor = id => {
    const n1 = c => [c[0] / 255, c[1] / 255, c[2] / 255];
    if (id <= 22) {
        const named = BLOCKS[id];
        const key = (named.top || named.all || "stone");
        const cmap = {
            "grass_top":[110,170,90], "dirt":[130,100,60], "stone":[140,140,140],
            "cobble":[128,128,128], "log_side":[110,80,45], "planks":[190,160,110],
            "leaves":[70,140,60], "sand":[220,200,140], "water":[90,160,220],
            "glass":[190,220,235], "bedrock":[60,60,64], "coal":[70,70,75],
            "iron":[150,130,110], "gold":[230,200,90], "diamond":[80,200,160],
            "brick":[170,100,80], "tnt_side":[200,90,80], "obsidian":[60,50,80],
            "craft_side":[190,160,110], "furnace_side":[130,130,135],
            "wool_white":[235,230,220], "gold_block":[240,200,50],
        };
        return n1(cmap[key] || [160,160,160]);
    }
    const imap = {
        [I_COAL]:[50,50,50], [I_IRON_INGOT]:[220,210,190], [I_GOLD_INGOT]:[245,210,90],
        [I_DIAMOND]:[80,230,170], [I_STICK]:[170,140,100], [I_WOOD_PICK]:[150,120,80],
        [I_STONE_PICK]:[150,150,150], [I_IRON_PICK]:[220,220,220],
        [I_DIAMOND_PICK]:[90,230,175], [I_AXE]:[210,180,150], [I_SHOVEL]:[190,190,190],
        [I_SWORD]:[200,200,205],
    };
    return n1(imap[id] || [180,180,180]);
};

MC.modelMat = new Float32Array(16);

MC.renderItemEntityBillboards = function (view, proj, eye) {
    const G = MC.gfx, gl0 = G.gl;
    if (!MC.itemEntities.length) return;
    for (const it of MC.itemEntities) {
        MC.mat4.identity(MC.modelMat);
        MC.mat4.translate(MC.modelMat, MC.modelMat, [it.x, it.y + Math.sin(it.age * 3) * 0.1, it.z]);
        MC.mat4.scale(MC.modelMat, MC.modelMat, [0.22, 0.22, 0.22]);
        MC.drawBox(MC.modelMat, MC.itemColor(it.id), null);
        void view; void proj; void eye;
    }
};

/* =========================================================
   04 · CHUNK STREAMING
   ======================================================== */
MC.loadRadius = 5;
MC.streamChunks = function () {
    const p = MC.playerPos;
    const cx = Math.floor(p[0] / 16), cz = Math.floor(p[2] / 16);
    for (let dx = -MC.loadRadius; dx <= MC.loadRadius; dx++) {
        for (let dz = -MC.loadRadius; dz <= MC.loadRadius; dz++) {
            const wx = cx + dx, wz = cz + dz;
            MC.world.chunk(wx, wz);                          // ensure generated
            if (!MC.gfx.hasChunk(wx, wz)) MC.gfx.markDirty(wx, wz);
        }
    }
    MC.gfx.processQueued(6);
};

/* =========================================================
   04 · MASTER TICK + RENDER
   ======================================================== */
MC.state = {
    mode: "creative",
    paused: true,
    started: false,
    dayTime: 9000,
    running: false,
    cameraShake: 0,
    fov: 75,
};

MC.step = function (dt) {
    if (!MC.state.running || !MC.world) return;
    MC.dtLast = dt;
    let timeScale = 1;
    MC.state.dayTime += dt * 3.6; // ~11 min full day
    if (MC.state.dayTime > 24000) MC.state.dayTime -= 24000;

    const p = MC.player;
    p.time = MC.state.dayTime;
    if (!MC.ui.panel && MC.state.mode === p.mode) {
        p.update(dt);
        MC.tryInteract(dt);
    }
    MC.tickMobs(dt, p);
    MC.tickFuses(dt);
    MC.tickParticles(dt);
    MC.tickItemEntities(dt, p);
    MC.streamChunks();
    if (MC.state.cameraShake > 0) MC.state.cameraShake = Math.max(0, MC.state.cameraShake - dt * 1.5);
};

MC.renderFrame = function (dt) {
    const G = MC.gfx;
    const p = MC.player;
    if (!G || !MC.world) return;
    G.setCanvas();

    const sky = MC.skyState(MC.state.dayTime);

    // camera
    const eye = [p.pos[0], p.pos[1] + MC.EYE, p.pos[2]];
    if (MC.state.cameraShake > 0) {
        eye[0] += (Math.random() - 0.5) * MC.state.cameraShake * 0.4;
        eye[1] += (Math.random() - 0.5) * MC.state.cameraShake * 0.4;
        eye[2] += (Math.random() - 0.5) * MC.state.cameraShake * 0.4;
    }
    const fwd = MC.dirFromAngles(p.yaw, p.pitch);
    const target = [eye[0] + fwd[0], eye[1] + fwd[1], eye[2] + fwd[2]];
    MC.mat4.perspective(G.proj, (MC.state.fov * Math.PI) / 180, MC.canvas.width / Math.max(1, MC.canvas.height), 0.1, 700);
    MC.mat4.lookAt(G.view, eye, target, [0, 1, 0]);

    G.drawSky(G.view, G.proj, eye, sky);

    const fog = sky.fog;
    G.drawChunks(G.view, G.proj, eye, fog, 80, 240, false);
    G.drawClouds(G.view, G.proj, fog, MC.state.dayTime, 80);
    G.drawChunks(G.view, G.proj, eye, fog, 80, 240, true);

    // mobs
    G.gl.enable(G.gl.DEPTH_TEST);
    MC.setWorldMatrix(G.view, G.proj, fog);
    for (const m of MC.mobs) MC.renderMob(m, MC.world);

    // draw the selected block wireframe
    MC.drawSelector(G.view, G.proj, eye, fwd);

    MC.renderItemEntityBillboards(G.view, G.proj, eye);
};

MC.drawSelector = function (view, proj, eye, fwd) {
    // distance check
    const reach = MC.pointReach[MC.player.mode] || 5;
    const hit = MC.raycast(eye, fwd, reach);
    const G = MC.gfx, gl0 = G.gl;
    if (!hit) return;
    const x = Math.floor(hit.x), y = Math.floor(hit.y), z = Math.floor(hit.z);
    // draw cube outline in screen space via overlay later (part 5 draws a CSS overlay) — here return coords
    MC.selectorHit = { x, y, z };
};


/* part extension point */
// [09-PART5]

/* =========================================================
   05 · CSS (injected, self-contained)
   ======================================================== */
MC.injectCSS = function () {
    if (document.getElementById("mcStyles")) return;
    const st = document.createElement("style");
    st.id = "mcStyles";
    st.textContent = `
:root {
  --mc: #262a2f; --mc2: #1b1e23; --mcg: #35c06e; --mcgr: #e34a4a;
}
#mcOverlay {
  position: fixed; inset: 0; z-index: 2147483000;
  background: #0b0d10; color: #dfe6ee;
  font-family: "Segoe UI", system-ui, sans-serif; overflow: hidden;
  user-select: none; -webkit-user-select: none;
}
#mcOverlay.hidden { display: none; }
.mc-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.mc-hud { position: absolute; inset: 0; pointer-events: none; }
.mc-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.mc-crosshair { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; }
.mc-crosshair::before, .mc-crosshair::after {
  content: ""; position: absolute; background: rgba(255,255,255,0.92); mix-blend-mode: difference;
}
.mc-crosshair::before { left: 50%; top: 0; width: 2px; height: 100%; margin-left: -1px; }
.mc-crosshair::after { top: 50%; left: 0; height: 2px; width: 100%; margin-top: -1px; }
.mc-selbox { position: absolute; border: 2px solid rgba(255,255,255,0.85); box-shadow: 0 0 0 1px rgba(0,0,0,0.5); }
.mc-hotbar {
  position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%);
  display: flex; gap: 4px; padding: 4px; background: rgba(10,10,14,0.55);
  border: 2px solid rgba(255,255,255,0.14); border-radius: 6px; pointer-events: auto;
}
.mc-slot {
  width: 46px; height: 46px; background: rgba(0,0,0,0.45);
  border: 2px solid rgba(255,255,255,0.18); border-radius: 4px;
  position: relative; display: flex; align-items: center; justify-content: center;
}
.mc-slot.sel { border-color: #fff; background: rgba(255,255,255,0.12); box-shadow: 0 0 8px rgba(255,255,255,0.25); }
.mc-slot .mc-sibling { }
.mc-ic { width: 34px; height: 34px; image-rendering: pixelated; }
.mc-cnt { position: absolute; right: 2px; bottom: 1px; font-size: 12px; font-weight: 700; color: #fff; text-shadow: 1px 1px 0 #000; }
.mc-bars { position: absolute; left: 50%; transform: translateX(-50%); bottom: 74px; display: flex; gap: 14px; align-items: center; }
.mc-hearts, .mc-food { display: flex; gap: 2px; }
.mc-heart, .mc-foodp { width: 18px; height: 18px; font-size: 15px; line-height: 18px; text-align: center; filter: drop-shadow(1px 1px 0 #000); }
.mc-top { position: absolute; top: 8px; left: 12px; right: 12px; display: flex; justify-content: space-between; font-size: 13px; opacity: 0.85; text-shadow: 1px 1px 0 #000; }
.mc-toast { position: absolute; top: 84px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.75); border: 1px solid rgba(255,255,255,0.25); border-radius: 6px;
  padding: 8px 14px; font-size: 14px; opacity: 0; transition: opacity .22s; }
.mc-toast.on { opacity: 1; }
.mc-vignette { position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%); }
.mc-fcode { position: absolute; left: 12px; top: 60px; font-family: Consolas, monospace; font-size: 12px; opacity: 0.7; white-space: pre-line; color: #8fe08f; }

/* menus */
.mc-menu { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: linear-gradient(180deg, rgba(20,28,40,0.96), rgba(8,10,16,0.98)); z-index: 5; gap: 16px; padding: 24px; }
.mc-menu h1 { font-size: 46px; margin: 0; letter-spacing: 2px; color: #cfe7ff; text-shadow: 0 4px 0 #0a1a2e; font-weight: 900; }
.mc-menu h1 b { color: #5ce68a; }
.mc-menu .sub { color: #8aa0bb; margin: -10px 0 6px; letter-spacing: 3px; font-size: 13px; }
.mc-menu .panel { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 20px 26px; display: grid; gap: 12px; min-width: 420px; max-width: 92vw; }
.mc-row { display: flex; align-items: center; gap: 10px; }
.mc-row label { width: 150px; color: #a9bcd4; font-size: 13px; }
.mc-input { background: #10141b; color: #dbe6f2; border: 2px solid #2b3646; border-radius: 6px; padding: 9px 12px; font-size: 15px; flex: 1; font-family: Consolas, monospace; }
.mc-input:focus { outline: none; border-color: #35c06e; }
.mc-btn { background: #35c06e; color: #06110a; border: 0; border-radius: 8px; padding: 13px 18px;
  font-size: 15px; font-weight: 800; cursor: pointer; letter-spacing: 0.5px; }
.mc-btn:hover { filter: brightness(1.12); }
.mc-btn.ghost { background: #222a36; color: #c7d6e8; }
.mc-btn.danger { background: #e34a4a; color: #fff; }
.mc-btn:disabled { opacity: 0.4; cursor: default; }
.mc-modebar { display: flex; gap: 8px; }
.mc-modebar button { border: 2px solid #2b3646; background: #10141b; color: #9fb3ca; border-radius: 8px; padding: 10px 16px; font-weight: 700; cursor: pointer; }
.mc-modebar button.on { border-color: #5ce68a; color: #5ce68a; }
.mc-help { color: #7d91ab; font-size: 12px; line-height: 1.8; min-width: 420px; max-width: 92vw; }
.mc-help b { color: #b7c9e0; }
.mc-err {
  display: none; background: rgba(200,30,30,0.96); color: #fff; border: 3px solid #ff4444;
  border-radius: 12px; padding: 24px 28px; margin: 10px 0 16px; white-space: pre-wrap;
  font-size: 16px; line-height: 1.6; font-family: Consolas, monospace;
  min-width: 340px; max-width: 92vw; z-index: 10; max-height: 300px; overflow: auto;
  box-shadow: 0 0 30px rgba(255,0,0,0.3);
}
.mc-err .mc-eh { font-weight: 800; font-size: 20px; letter-spacing: 1px; margin-bottom: 10px; }
.mc-err .mc-err-line { font-size: 18px; font-weight: 700; margin-bottom: 8px; padding: 6px 10px; background: rgba(0,0,0,0.35); border-radius: 6px; }
.mc-err .mc-err-stack { font-size: 12px; opacity: 0.85; }
.mc-err .mc-err-meta { margin-top: 10px; font-size: 11px; opacity: 0.6; }
.mc-paused { position: absolute; inset: 0; background: rgba(5,6,9,0.72); backdrop-filter: blur(3px); z-index: 6; display: flex; align-items: center; justify-content: center; }
.mc-paused.hidden, .mc-menu.hidden, .mc-death.hidden { display: none; }
.mc-menu-card { background: #151a22; border: 1px solid #2b3646; border-radius: 14px; padding: 28px 34px; display: grid; gap: 12px; min-width: 340px; text-align: center; }
.mc-menu-card h2 { margin: 0 0 4px; color: #dfeaff; }
.mc-menu-card .lbl { color: #8aa0bb; font-size: 12px; letter-spacing: 2px; }

/* inventory / crafting / furnace panels */
.mc-overlay-panel { position: absolute; inset: 0; background: rgba(8,10,14,0.82); z-index: 7; display: flex; align-items: center; justify-content: center; }
.mc-overlay-panel.hidden { display: none; }
.mc-panel { background: #171d26; border: 2px solid #313d4f; border-radius: 12px; padding: 18px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.mc-panel h3 { margin: 0 0 10px; color: #dbe6f2; font-size: 16px; letter-spacing: 1px; }
.mc-slots { display: grid; gap: 5px; }
.mc-slots .mc-slot { width: 44px; height: 44px; cursor: pointer; }
.mc-panel-body { display: flex; gap: 24px; align-items: flex-start; }
.mc-craftzone { display: flex; gap: 14px; align-items: center; }
.mc-craft-grid { display: grid; gap: 4px; }
.mc-arrow { font-size: 26px; color: #7d91ab; }
.mc-result { width: 48px; height: 48px; background: #0c0f14; border: 2px dashed #4a5a70; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.mc-result.hot { border-color: #5ce68a; }
.mc-furnace { display: grid; grid-template-columns: 64px 40px 64px 64px; gap: 14px; align-items: center; }
.mc-furnace-buttons { display: flex; flex-direction: column; gap: 8px; }
.mc-fillbar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #35c06e; }
.mc-progress { margin-top: 10px; height: 6px; background: #0c0f14; border-radius: 3px; overflow: hidden; }
.mc-progress div { height: 100%; background: linear-gradient(90deg, #ff9d3c, #ffcf6b); }
.mc-close-x { position: absolute; top: 10px; right: 14px; color: #fff; font-size: 22px; cursor: pointer; opacity: 0.7; }
.mc-close-x:hover { opacity: 1; }
.mc-death { position: absolute; inset: 0; z-index: 8; background: rgba(30,0,0,0.78); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 18px; }
.mc-death h2 { color: #ff5555; font-size: 44px; text-shadow: 0 4px 0 #400; letter-spacing: 2px; }
.mc-tag { position: absolute; top: 46px; left: 12px; font-size: 12px; color: #7d91ab; }
.mc-flash { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, rgba(255,0,0,0.0) 40%, rgba(255,0,0,0.5) 100%); opacity: 0; transition: opacity .12s; }
.mc-selbox { pointer-events: none; }
`;
    document.head.appendChild(st);
};


/* =========================================================
   05 · UI STATE / DOM
   ======================================================== */
MC.ui = { menus: null, hudSet: 0, toastTimer: null, panel: null };

MC.makeUI = function () {
    MC.injectCSS();
    const root = document.createElement("div");
    root.id = "mcOverlay";
    root.className = "hidden";
    root.innerHTML = `
  <canvas class="mc-canvas" id="mcCanvas"></canvas>
  <div class="mc-hud" id="mcHud">
    <div class="mc-crosshair"></div>
    <div class="mc-selbox hidden" id="mcSel"></div>
    <div class="mc-hotbar" id="mcHotbar"></div>
    <div class="mc-bars">
      <div class="mc-hearts" id="mcHearts"></div>
      <div class="mc-food" id="mcFood"></div>
    </div>
    <div class="mc-top">
      <span id="mcFps"></span>
      <span id="mcClock"></span>
    </div>
    <div class="mc-tag">MINECRAFT QUEST</div>
    <div class="mc-fcode hidden" id="mcFcode"></div>
    <div class="mc-toast" id="mcToast"></div>
    <div class="mc-vignette"></div>
    <div class="mc-flash" id="mcFlash"></div>
  </div>
  <div class="mc-death hidden" id="mcDeath">
    <h2>YOU DIED</h2>
    <div class="lbl" style="color:#c9a6a6">A blocky moment of silence…</div>
    <div>
      <button class="mc-btn" id="mcRespawn">♥ RESPAWN</button>
      <button class="mc-btn ghost" id="mcDeathQuit">LEAVE WORLD</button>
    </div>
  </div>
  <div class="mc-paused hidden" id="mcPaused">
    <div class="mc-menu-card">
      <h2>PAUSED</h2>
      <button class="mc-btn" id="mcResume">▶ RESUME</button>
      <button class="mc-btn ghost" id="mcSaveTitle">💾 SAVE &amp; TITLE</button>
      <button class="mc-btn danger" id="mcQuitArcade">✕ QUIT TO ARCADE</button>
    </div>
  </div>
  <div class="mc-menu" id="mcMainMenu">
    <h1>MINECRAFT <b>QUEST</b></h1>
    <div class="sub">TEAQUEST ARCADE · VOXEL SANDBOX · v${MC.VERSION}</div>
    <div id="mcErr" class="mc-err" style="display:none"></div>
    <div class="panel">
      <div class="mc-row"><label>SEED</label><input class="mc-input" id="mcSeed" value="" spellcheck="false"></div>
      <div class="mc-modebar" id="mcModeBar">
        <button data-m="creative" class="on">CREATIVE</button>
        <button data-m="survival">SURVIVAL</button>
      </div>
      <button class="mc-btn" id="mcBtnNew">🌍 CREATE WORLD</button>
      <button class="mc-btn ghost" id="mcBtnContinue" disabled>↻ CONTINUE WORLD</button>
      <button class="mc-btn danger" id="mcBtnWipe" disabled>🗑 DELETE SAVE</button>
      <button class="mc-btn ghost" id="mcMenuQuit">✕ QUIT TO ARCADE</button>
    </div>
    <div class="mc-help">
      <b>WASD</b> move · <b>MOUSE</b> look (click to lock) · <b>SPACE</b> jump / fly up · <b>SHIFT</b> sneak / fly down ·
      <b>CTRL</b> sprint · <b>DOUBLE-SPACE</b> fly toggle<br>
      <b>LMB</b> mine / attack · <b>RMB</b> place / use (crafting table, furnace) · <b>E</b> inventory · <b>1–9</b> / <b>WHEEL</b> hotbar · <b>F3</b> debug
    </div>
  </div>
  <div class="mc-overlay-panel hidden" id="mcInvPanel"></div>
  <div class="mc-overlay-panel hidden" id="mcCraftPanel"></div>
  <div class="mc-overlay-panel hidden" id="mcFurnacePanel"></div>
  `;
    document.body.appendChild(root);

    MC.canvas = root.querySelector("#mcCanvas");
    MC.overlay = root;
    MC.ui['hotbar'] = root.querySelector("#mcHotbar");
    MC.ui['hearts'] = root.querySelector("#mcHearts");
    MC.ui['food'] = root.querySelector("#mcFood");
    MC.ui['clock'] = root.querySelector("#mcClock");
    MC.ui['fps'] = root.querySelector("#mcFps");
    MC.ui['fcode'] = root.querySelector("#mcFcode");
    MC.ui['toast'] = root.querySelector("#mcToast");
    MC.ui['sel'] = root.querySelector("#mcSel");
    MC.ui['death'] = root.querySelector("#mcDeath");
    MC.ui['paused'] = root.querySelector("#mcPaused");
    MC.ui['menu'] = root.querySelector("#mcMainMenu");
    MC.ui['inv'] = root.querySelector("#mcInvPanel");
    MC.ui['craft'] = root.querySelector("#mcCraftPanel");
    MC.ui['furn'] = root.querySelector("#mcFurnacePanel");
    MC.ui['flash'] = root.querySelector("#mcFlash");

    // seed: random default
    MC.ui['seedInput'] = root.querySelector("#mcSeed");

    // mode bar
    MC.ui['modeBar'] = root.querySelector("#mcModeBar");
    MC.ui['modeBar'].addEventListener("click", e => {
        const b = e.target.closest("button");
        if (!b || !b.dataset.m) return;
        MC.ui['modeBar'].querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
        MC.ui.mode = b.dataset.m;
    });
    MC.ui.mode = "creative";

    root.querySelector("#mcBtnNew").addEventListener("click", () => MC.startNew());
    root.querySelector("#mcBtnContinue").addEventListener("click", () => MC.continueWorld());
    root.querySelector("#mcBtnWipe").addEventListener("click", () => { MC.clearSave(); MC.refreshMenu(); MC.toast("Save deleted."); });
    root.querySelector("#mcMenuQuit").addEventListener("click", () => MC.quitToArcade(false));

    root.querySelector("#mcResume").addEventListener("click", () => MC.resumeGame());
    root.querySelector("#mcSaveTitle").addEventListener("click", () => MC.saveAndTitle());
    root.querySelector("#mcQuitArcade").addEventListener("click", () => MC.quitToArcade());
    root.querySelector("#mcRespawn").addEventListener("click", () => MC.respawn());
    root.querySelector("#mcDeathQuit").addEventListener("click", () => MC.quitToArcade());

    // canvas pointer lock + size
    const resize = () => {
        MC.canvas.width = root.clientWidth;
        MC.canvas.height = root.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    document.addEventListener("pointerlockchange", () => {
        const locked = document.pointerLockElement === MC.canvas;
        MC.input.locked = locked;
        if (!locked && MC.state.running && !MC.ui.panel && !MC.ui['death'].classList.contains("hidden")) {
            MC.showPause();
        }
    });

    MC.canvas.addEventListener("click", () => {
        if (MC.state.running && !MC.ui.panel) {
            MC.canvas.requestPointerLock && MC.canvas.requestPointerLock();
        }
    });

    MC.refreshMenu();
};

MC.refreshMenu = function () {
    const has = !!MC.loadWorld();
    MC.ui['menu'].querySelector("#mcBtnContinue").disabled = !has;
    MC.ui['menu'].querySelector("#mcBtnWipe").disabled = !has;
    if (!MC.ui['seedInput'].value) MC.ui['seedInput'].value = String((Math.random() * 0xffffffff) | 0);
};


/* =========================================================
   05 · WORLD START / SAVE
   ======================================================== */
MC.startNew = function () {
    try {
        MC.hideErr();
        const seed = (parseInt(MC.ui['seedInput'].value, 10) >>> 0) || (Math.random() * 0xffffffff | 0) >>> 0;
        const mode = MC.ui.mode;
        MC.buildWorld(seed, mode, false);
    } catch (e) {
        console.error(e);
        MC.showErr(String(e && (e.stack || e.message || e)));
    }
};
MC.continueWorld = function () {
    const data = MC.loadWorld();
    if (!data) { MC.toast("No saved world."); return; }
    MC.buildWorld(data.seed, data.mode || "survival", true, data);
};

MC.buildWorld = function (seed, mode, resume, saveData) {
    MC.cleanupWorld();
    MC.world = new MC.World(seed);
    MC.state.mode = mode;
    MC.player = new MC.Player();
    MC.player.mode = mode;

    if (resume && saveData && saveData.player) {
        const pd = saveData.player;
        MC.player.pos = [pd.x, pd.y, pd.z];
        MC.player.hp = pd.hp !== undefined ? pd.hp : 20;
        MC.player.hunger = pd.hunger !== undefined ? pd.hunger : 20;
        MC.player.hotbarSlot = pd.hotbarSlot || 0;
        MC.state.dayTime = pd.time !== undefined ? pd.time : 9000;
        if (pd.inventory) MC.player.inventory = pd.inventory;
        MC.state.mode = pd.mode === "survival" ? "survival" : "creative";
        MC.player.mode = MC.state.mode;
    } else {
        const sp = MC.world.findSpawn();
        MC.player.pos = [sp.x, sp.y, sp.z];
        MC.player.spawnY = sp.y;
        MC.state.dayTime = 9000;
        if (mode === "creative") {
            MC.CREATIVE_HOTBAR.forEach((id, i) => { MC.player.inventory[i] = { id, count: 64 }; });
        }
    }

    if (resume && saveData) MC.applyEdits(MC.world, saveData.edits);

    // atlas + gl
    if (!MC.atlasCanvas) MC.buildAtlas();
    if (!MC.gfxReady) {
        if (!MC.gfx.init(MC.world)) { MC.toast("WebGL not available."); return false; }
        MC.gfxReady = true;
    } else {
        MC.gfx.setWorld(MC.world);
    }
    MC.runStats = { blocksMined: 0, blocksPlaced: 0, mobsSlain: 0 };

    // mesh the spawn area quickly
    MC.playerPos[0] = MC.player.pos[0]; MC.playerPos[1] = MC.player.pos[1]; MC.playerPos[2] = MC.player.pos[2];
    MC.streamChunks();

    MC.state.running = true;
    MC.state.paused = false;
    MC.overlay.querySelector("#mcMainMenu").classList.add("hidden");
    MC.ui['menu'] = MC.overlay.querySelector("#mcMainMenu");
    MC.setPanel(null);

    // request pointer lock (buildWorld is invoked from trusted user click handlers)
    MC.ui.panelGate = true;
    try {
        MC.canvas.requestPointerLock && MC.canvas.requestPointerLock();
    } catch (e) { /* pointer lock unsupported */ }
    setTimeout(() => { MC.ui.panelGate = false; }, 400);
    MC.hidePause();
    if (!MC.loopStarted) MC.startLoop();
    MC.intro();
    return true;
};

MC.cleanupWorld = function () {
    if (MC.loopStarted) { /* keep loop; just reset datasets */ }
    MC.mobs.length = 0;
    MC.fuses.length = 0;
    MC.particles.length = 0;
    MC.itemEntities.length = 0;
};

MC.intro = function () {
    MC.toast("Welcome to Minecraft Quest " + (MC.player.mode === "creative" ? "— Creative" : "— Survival"), 2600);
};

MC.saveAndTitle = function () {
    MC.saveWorld(MC.world, MC.player, MC.state.mode);
    MC.toast("World saved.");
    setTimeout(() => MC.quitToArcade(false), 500);
};

MC.quitToArcade = function (record) {
    if (record !== false && MC.world && MC.player) {
        MC.finishRun();
    }
    MC.state.running = false;
    MC.ui['menu'] && MC.ui['menu'].classList.remove("hidden");
    if (MC.overlay) MC.overlay.classList.add("hidden");
    document.body.style.overflow = "";
    if (typeof window.closeModal === "function") window.closeModal(MC.arcadeRef && MC.arcadeRef.current);
    if (typeof window.resumeScroll === "function") window.resumeScroll();
    MC.ui.panelGate = false;
    MC.setPanel(null);
};

MC.finishRun = function () {
    try {
        const p = MC.player;
        const survival = MC.state.mode === "survival";
        const dayFrac = (MC.state.dayTime + (survival ? 9000 : 24000)) / 24000;
        let score = 0;
        if (survival) {
            score = Math.floor((MC.runStats.blocksMined || 0) + (MC.runStats.mobsSlain || 0) * 5 + Math.floor(dayFrac) * 200);
            if (score < 10) score = 10;
        } else {
            score = Math.floor((MC.runStats.blocksPlaced || 0) + (MC.runStats.blocksMined || 0));
        }
        MC.runStats.score = score;
        const saved = window.saveArcadeScore && window.saveArcadeScore("minecraft-quest", score);
        MC.toast(score > 0 ? `Quest complete — score ${score}${saved && saved.isNewRecord ? " · NEW RECORD!" : ""}` : "Quest complete!", 3000);
        if (window.awardArcadeXp) window.awardArcadeXp(15 + Math.min(35, Math.floor(score / 10)));
        if (window.renderArcadeBests) window.renderArcadeBests();
        if (window.renderArcadeRecords) window.renderArcadeRecords();
    } catch (e) { console.warn(e); }
};

MC.runStats = { blocksMined: 0, blocksPlaced: 0, mobsSlain: 0 };

MC.respawn = function () {
    MC.player.hp = 20;
    MC.player.hunger = 20;
    const sp = MC.world.findSpawn();
    MC.player.pos = [sp.x, sp.y, sp.z];
    MC.player.spawnY = sp.y;
    MC.player.vel = [0, 0, 0];
    MC.ui['death'].classList.add("hidden");
    MC.state.running = true;
    MC.hidePause();
    MC.canvas.requestPointerLock && MC.canvas.requestPointerLock();
};

MC.onPlayerDeath = function () {
    MC.state.running = false;
    MC.showToastExpired();
    MC.ui['death'].classList.remove("hidden");
    MC.sfx.level();
};


/* =========================================================
   05 · PAUSE / RESUME
   ======================================================== */
MC.showPause = function () {
    if (MC.ui['paused'] && MC.state.running) {
        MC.ui['paused'].classList.remove("hidden");
        MC.ui.panel = true;
    }
};
MC.hidePause = function () {
    if (MC.ui['paused']) { MC.ui['paused'].classList.add("hidden"); MC.ui.panel = false; }
};
MC.resumeGame = function () {
    MC.hidePause();
    MC.canvas.requestPointerLock && MC.canvas.requestPointerLock();
    setTimeout(() => { MC.ui.panelGate = false; }, 300);
};

MC.setPanel = function (which) {
    MC.ui.panel = which ? which : null;
    for (const key of ["inv", "craft", "furn"]) {
        const el = MC.ui[key];
        el && el.classList.toggle("hidden", which !== key);
    }
};


/* =========================================================
   05 · TOAST + HUD
   ======================================================== */
MC.showErr = function (msg) {
    MC.state.running = false;
    if (MC.overlay) MC.overlay.classList.remove("hidden");
    if (MC.ui['menu']) MC.ui['menu'].classList.remove("hidden");
    const el = MC.ui && MC.ui['menu'] && MC.ui['menu'].querySelector('#mcErr');
    if (!el) return;
    const text = String(msg);
    const firstLine = text.split("\n")[0];
    el.innerHTML =
        '<div class="mc-eh">MINECRAFT QUEST ERROR</div>' +
        '<div class="mc-err-line">' + firstLine.replace(/</g,'&lt;') + '</div>' +
        '<div class="mc-err-stack">' + text.replace(/</g,'&lt;') + '</div>' +
        '<div class="mc-err-meta">v' + MC.VERSION + ' · ' + (typeof navigator !== "undefined" ? navigator.userAgent.slice(0,90) : "?") + '</div>';
    el.style.display = 'block';
    try { el.scrollIntoView(); } catch(e) {}
    console.error('[Minecraft Quest]', text);
};
MC.hideErr = function () {
    const el = MC.ui && MC.ui['menu'] && MC.ui['menu'].querySelector('#mcErr');
    if (el) el.style.display = 'none';
};
MC.toast = function (msg, ms) {
    const t = MC.ui['toast'];
    if (!t) return;
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(MC.ui.toastTimer);
    MC.ui.toastTimer = setTimeout(() => t.classList.remove("on"), ms || 1800);
};
MC.showToastExpired = function () {};

MC.renderHotbar = function () {
    const p = MC.player;
    const hb = MC.ui['hotbar'];
    hb.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        const slot = p.inventory[i];
        const d = document.createElement("div");
        d.className = "mc-slot" + (i === p.hotbarSlot ? " sel" : "");
        if (slot.id > 0) {
            const ic = document.createElement("canvas");
            ic.className = "mc-ic";
            ic.width = ic.height = 32;
            const g = ic.getContext("2d");
            g.imageSmoothingEnabled = false;
            g.drawImage(MC.atlasCanvas, ...MC.uvrect(MC.itemTexture(slot.id)), 0, 0, 32, 32);
            d.appendChild(ic);
            if (slot.count > 1) {
                const c = document.createElement("span");
                c.className = "mc-cnt"; c.textContent = slot.count;
                d.appendChild(c);
            }
        }
        d.addEventListener("mousedown", e => { p.hotbarSlot = i; e.stopPropagation(); });
        hb.appendChild(d);
    }
};

MC.uvrect = function (tileName) {
    const t = MC.TILE[tileName];
    const cols = 16, ts = 16, rows = Math.ceil(TILE_NAMES.length / cols);
    const atlasW = cols * ts, atlasH = rows * ts;
    return [
        t.col * ts, t.row * ts, ts, ts,
    ];
};

MC.renderBars = function () {
    const p = MC.player;
    const hearts = MC.ui['hearts']; hearts.innerHTML = "";
    for (let i = 0; i < 10; i++) {
        const s = document.createElement("span");
        s.className = "mc-heart";
        const hp = p.hp;
        s.textContent = "♥";
        s.style.opacity = hp >= (i + 1) * 2 ? 1 : hp >= i * 2 + 1 ? 0.55 : 0.18;
        s.style.color = "#ff5a5a";
        hearts.appendChild(s);
    }
    const food = MC.ui['food']; food.innerHTML = "";
    for (let i = 0; i < 10; i++) {
        const s = document.createElement("span");
        s.className = "mc-foodp";
        const hg = p.hunger;
        s.textContent = "◆";
        s.style.opacity = hg >= i * 2 ? 1 : 0.18;
        s.style.color = "#f2b23c";
        food.appendChild(s);
    }
};

MC.tickClock = function () {
    const t = MC.state.dayTime % 24000;
    const hours = Math.floor((t / 1000) + 6) % 24;
    const mins = Math.floor((t % 1000) / 1000 * 60);
    MC.ui['clock'].textContent =
        String(hours).padStart(2, "0") + ":" + String(mins).padStart(2, "0");
};

MC.renderDebug = function () {
    if (!MC.ui['fcode'].classList.contains("hidden") && MC.player) {
        const c = MC.player.pos;
        MC.ui['fcode'].textContent =
            `XYZ ${c[0].toFixed(1)} / ${c[1].toFixed(1)} / ${c[2].toFixed(1)}\n` +
            `CHUNK ${Math.floor(c[0] / 16)} / ${Math.floor(c[2] / 16)}\n` +
            `MODE ${MC.state.mode.toUpperCase()}\n` +
            `MOBS ${MC.mobs.length} · QUEUED ${MC.gfx.remainingQueued}\n` +
            `SEED ${MC.world.seed}`;
    }
};

MC.updateSelectorBox = function (viewM, projM, eye, fwd) {
    const s = MC.ui['sel'];
    const hit = MC.raycast(eye, fwd, MC.pointReach[MC.player.mode] || 5);
    MC.selectorHit = hit;
    if (!hit) { s.classList.add("hidden"); return; }
    s.classList.remove("hidden");
    // project the 8 corners of the block cube
    const corners = [];
    for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) for (let dz = 0; dz < 2; dz++)
        corners.push([hit.x + dx, hit.y + dy, hit.z + dz]);
    const pts = corners.map(c => MC.project(viewM, projM, c, MC.canvas));
    if (pts.some(p => p[2] > 1 && p[2] < -1)) { }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const ox = Math.min(...xs), oy = Math.min(...ys), w = Math.max(...xs) - ox, h = Math.max(...ys) - oy;
    s.style.left = ox + "px";
    s.style.top = oy + "px";
    s.style.width = Math.max(1, w) + "px";
    s.style.height = Math.max(1, h) + "px";
};

MC.project = function (view, proj, worldPt, canvas) {
    const v = view, p = proj;
    // apply view
    let x = worldPt[0], y = worldPt[1], z = worldPt[2];
    let cx = v[0] * x + v[4] * y + v[8] * z + v[12];
    let cy = v[1] * x + v[5] * y + v[9] * z + v[13];
    let cz = v[2] * x + v[6] * y + v[10] * z + v[14];
    let cw = v[3] * x + v[7] * y + v[11] * z + v[15];
    // apply proj
    let nx = p[0] * cx + p[4] * cy + p[8] * cz + p[12] * cw;
    let ny = p[1] * cx + p[5] * cy + p[9] * cz + p[13] * cw;
    let nw = p[3] * cx + p[7] * cy + p[11] * cz + p[15] * cw;
    const ndcX = nx / nw, ndcY = ny / nw;
    return [
        (ndcX * 0.5 + 0.5) * canvas.width,
        (1 - (ndcY * 0.5 + 0.5)) * canvas.height,
        nw,
    ];
};


/* =========================================================
   05 · INVENTORY / CRAFTING / FURNACE PANELS
   ======================================================== */
MC.panelState = { pick: null };

MC.buildSlotsGrid = function (start, count, cols, onClick) {
    const wrap = document.createElement("div");
    wrap.className = "mc-slots";
    wrap.style.gridTemplateColumns = `repeat(${cols}, 44px)`;
    for (let i = 0; i < count; i++) {
        const idx = start + i;
        const slot = MC.player.inventory[idx];
        const d = document.createElement("div");
        d.className = "mc-slot";
        if (slot.id > 0) {
            const ic = document.createElement("canvas");
            ic.className = "mc-ic"; ic.width = ic.height = 32;
            const g = ic.getContext("2d");
            g.imageSmoothingEnabled = false;
            g.drawImage(MC.atlasCanvas, ...MC.uvrect(MC.itemTexture(slot.id)), 0, 0, 32, 32);
            d.appendChild(ic);
            if (slot.count > 1) {
                const c = document.createElement("span");
                c.className = "mc-cnt"; c.textContent = slot.count;
                d.appendChild(c);
            }
        }
        d.addEventListener("click", e => onClick && onClick(idx, e));
        wrap.appendChild(d);
    }
    return wrap;
};

MC.openInventory = function () {
    const panel = MC.ui['inv'];
    panel.innerHTML = "";
    const box = document.createElement("div");
    box.className = "mc-panel";
    box.style.position = "relative";
    const close = document.createElement("span");
    close.className = "mc-close-x"; close.textContent = "×";
    close.addEventListener("click", () => MC.closePanels());
    const title = document.createElement("h3"); title.textContent = "INVENTORY";
    box.appendChild(close); box.appendChild(title);

    const body = document.createElement("div");
    body.className = "mc-panel-body";

    // 2x2 crafting zone
    const craftzone = document.createElement("div");
    craftzone.className = "mc-craftzone";
    const cgrid = document.createElement("div");
    cgrid.className = "mc-craft-grid";
    cgrid.style.gridTemplateColumns = "repeat(2, 44px)";
    const cSlots = [0, 0, 0, 0]; // item ids
    const cellEls = [];
    for (let i = 0; i < 4; i++) {
        const d = document.createElement("div");
        d.className = "mc-slot";
        cellEls.push(d);
        d.addEventListener("click", () => {
            // place picked item or take
            const pick = MC.panelState.pick;
            if (pick && pick.id > 0) {
                if (cSlots[i] === 0 && MC.player.consumeItem(pick.id, 1)) {
                    cSlots[i] = pick.id;
                }
            } else if (cSlots[i] !== 0) {
                MC.player.addItem(cSlots[i], 1);
                cSlots[i] = 0;
            }
            MC.renderCraftCells(cellEls, cSlots, recZone);
            MC.updateCraft(cSlots, recZone);
            MC.renderHotbar();
        });
        cgrid.appendChild(d);
    }
    craftzone.appendChild(cgrid);
    const res = document.createElement("div");
    res.className = "mc-result"; res.id = "mcCraftRes";
    craftzone.appendChild(res);
    const recZone = { cgrid: cgrid, res, cSlots, cellEls };
    const title2 = document.createElement("div");
    title2.style.cssText = "font-size:12px;color:#8aa0bb;margin-bottom:6px;";
    title2.textContent = "Crafting";
    const craftCol = document.createElement("div"); craftCol.style.display = "grid";
    craftCol.appendChild(title2); craftCol.appendChild(craftzone);
    body.appendChild(craftCol);

    // main grid 27 + hotbar row
    const mainWrap = document.createElement("div");
    mainWrap.style.display = "grid"; mainWrap.style.gap = "6px";
    mainWrap.appendChild(MC.buildSlotsGrid(9, 27, 9, (idx) => MC.pickSlot(idx)));
    const hbRow = MC.buildSlotsGrid(0, 9, 9, (idx) => MC.pickSlot(idx));
    const hbLabel = document.createElement("div");
    hbLabel.style.cssText = "font-size:12px;color:#8aa0bb;margin-bottom:6px;";
    hbLabel.textContent = "Hotbar";
    const hbCol = document.createElement("div"); hbCol.style.display = "grid";
    hbCol.appendChild(hbLabel); hbCol.appendChild(hbRow);
    mainWrap.appendChild(hbCol);
    body.appendChild(mainWrap);

    box.appendChild(body);
    panel.appendChild(box);
    MC.showToastHelp("Click item to pick up · right-click places one", 0);
    MC.renderCraftCells(cellEls, cSlots, recZone);
    MC.updateCraft(cSlots, recZone);

    MC.setPanel("inv");
    MC.ui.invCtx = { cSlots, cellEls, recZone };
    document.exitPointerLock && document.exitPointerLock();
};

MC.renderCraftCells = (cellEls, cSlots, recZone) => {
    cellEls.forEach((el, i) => {
        el.innerHTML = "";
        const id = cSlots[i];
        if (id > 0) {
            const ic = document.createElement("canvas");
            ic.className = "mc-ic"; ic.width = ic.height = 32;
            const g = ic.getContext("2d");
            g.imageSmoothingEnabled = false;
            g.drawImage(MC.atlasCanvas, ...MC.uvrect(MC.itemTexture(id)), 0, 0, 32, 32);
            el.appendChild(ic);
        }
    });
};

MC.updateCraft = (cSlots, recZone) => {
    const grid = [
        [cSlots[0], cSlots[1]],
        [cSlots[2], cSlots[3]],
    ];
    const rec = MC.matchCrafting(grid);
    recZone.res.innerHTML = "";
    recZone.res.classList.remove("hot");
    if (rec) {
        recZone.res.classList.add("hot");
        const ic = document.createElement("canvas");
        ic.className = "mc-ic"; ic.width = ic.height = 32;
        const g = ic.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(MC.atlasCanvas, ...MC.uvrect(MC.itemTexture(rec.out)), 0, 0, 32, 32);
        recZone.res.appendChild(ic);
        const c = document.createElement("span");
        c.className = "mc-cnt"; c.textContent = "×" + rec.n;
        recZone.res.appendChild(c);
        recZone.res.dataset.out = rec.out;
        recZone.res.dataset.n = rec.n;
        recZone.res.addEventListener("click", () => {
            MC.player.addItem(rec.out, rec.n);
            for (const need of MC.craftUses(rec)) {
                MC.player.consumeItem(need.id, need.count);
            }
            cSlots.fill(0);
            MC.renderCraftCells(recZone.cellEls, cSlots, recZone);
            MC.updateCraft(cSlots, recZone);
            MC.renderHotbar();
            MC.sfx.craft();
        });
    }
};

MC.pickSlot = function (idx, e) {
    const p = MC.player;
    const slot = p.inventory[idx];
    const pick = MC.panelState.pick;
    const right = e && (e.button === 2 || e.metaKey || e.ctrlKey);
    if (pick && pick.id > 0) {
        // place picked into slot
        if (slot.id === 0) {
            slot.id = pick.id; slot.count = 1;
            pick.count -= 1;
            if (pick.count <= 0) MC.panelState.pick = null;
        } else if (slot.id === pick.id && slot.count < 64) {
            slot.count += 1;
            pick.count -= 1;
            if (pick.count <= 0) MC.panelState.pick = null;
        } else {
            // swap
            const tmp = { id: slot.id, count: slot.count };
            slot.id = pick.id; slot.count = pick.count;
            MC.panelState.pick = tmp;
        }
    } else if (slot.id > 0) {
        if (right && pick === null) {
            MC.panelState.pick = { id: slot.id, count: Math.ceil(slot.count / 2) };
            slot.count = Math.floor(slot.count / 2);
            if (slot.count <= 0) { slot.id = 0; slot.count = 0; }
        } else {
            MC.panelState.pick = { id: slot.id, count: slot.count };
            slot.id = 0; slot.count = 0;
        }
    }
    MC.openInventory();
    // pick cursor cell visible in a stub icon (panels re-render) — simple: redraw hotbar only
    MC.renderHotbar();
};

MC.closePanels = function () {
    MC.setPanel(null);
    MC.ui.panelGate = false;
    MC.hidePause();
    MC.canvas.requestPointerLock && MC.canvas.requestPointerLock();
};

MC.openCraftTable = function () {
    const panel = MC.ui['craft'];
    panel.innerHTML = "";
    const box = document.createElement("div");
    box.className = "mc-panel";
    box.style.position = "relative";
    const close = document.createElement("span");
    close.className = "mc-close-x"; close.textContent = "×";
    close.addEventListener("click", () => MC.closePanels());
    const title = document.createElement("h3"); title.textContent = "CRAFTING TABLE";
    box.appendChild(close); box.appendChild(title);

    const body = document.createElement("div");
    body.className = "mc-panel-body";
    const craftzone = document.createElement("div");
    craftzone.className = "mc-craftzone";
    const cgrid = document.createElement("div");
    cgrid.className = "mc-craft-grid";
    cgrid.style.gridTemplateColumns = "repeat(3, 44px)";
    const cSlots = new Array(9).fill(0);
    const cellEls = [];
    for (let i = 0; i < 9; i++) {
        const d = document.createElement("div");
        d.className = "mc-slot";
        cellEls.push(d);
        d.addEventListener("click", () => {
            const pick = MC.panelState.pick;
            if (pick && pick.id > 0) {
                if (cSlots[i] === 0 && MC.player.consumeItem(pick.id, 1)) {
                    cSlots[i] = pick.id;
                }
            } else if (cSlots[i] !== 0) {
                MC.player.addItem(cSlots[i], 1);
                cSlots[i] = 0;
            }
            MC.renderCraftCells3(cellEls, cSlots);
            MC.updateCraft3(cSlots, res);
            MC.renderHotbar();
        });
        cgrid.appendChild(d);
    }
    const res = document.createElement("div");
    res.className = "mc-result";
    craftzone.appendChild(cgrid); craftzone.appendChild(res);
    body.appendChild(craftzone);

    const invWrap = document.createElement("div");
    invWrap.style.display = "grid"; invWrap.style.gap = "6px";
    invWrap.appendChild(MC.buildSlotsGrid(9, 27, 9, (idx) => MC.pickSlot(idx)));
    const hbRow = MC.buildSlotsGrid(0, 9, 9, (idx) => MC.pickSlot(idx));
    invWrap.appendChild(hbRow);
    body.appendChild(invWrap);

    box.appendChild(body);
    panel.appendChild(box);
    MC.renderCraftCells3(cellEls, cSlots);
    MC.updateCraft3(cSlots, res);
    MC.setPanel("craft");
    MC.ui.invCtx = { cSlots, cellEls, res };
    document.exitPointerLock && document.exitPointerLock();
};

MC.renderCraftCells3 = (cellEls, cSlots) => {
    cellEls.forEach((el, i) => {
        el.innerHTML = "";
        const id = cSlots[i];
        if (id > 0) {
            const ic = document.createElement("canvas");
            ic.className = "mc-ic"; ic.width = ic.height = 32;
            const g = ic.getContext("2d");
            g.imageSmoothingEnabled = false;
            g.drawImage(MC.atlasCanvas, ...MC.uvrect(MC.itemTexture(id)), 0, 0, 32, 32);
            el.appendChild(ic);
        }
    });
};

MC.updateCraft3 = (cSlots, res) => {
    const grid = [
        cSlots.slice(0, 3), cSlots.slice(3, 6), cSlots.slice(6, 9),
    ];
    const rec = MC.matchCrafting(grid);
    res.innerHTML = "";
    res.classList.remove("hot");
    if (rec) {
        res.classList.add("hot");
        const ic = document.createElement("canvas");
        ic.className = "mc-ic"; ic.width = ic.height = 32;
        const g = ic.getContext("2d");
        g.imageSmoothingEnabled = false;
        g.drawImage(MC.atlasCanvas, ...MC.uvrect(MC.itemTexture(rec.out)), 0, 0, 32, 32);
        res.appendChild(ic);
        const c = document.createElement("span");
        c.className = "mc-cnt"; c.textContent = "×" + rec.n;
        res.appendChild(c);
        res.onclick = () => {
            MC.player.addItem(rec.out, rec.n);
            for (const need of MC.craftUses(rec)) MC.player.consumeItem(need.id, need.count);
            cSlots.fill(0);
            MC.renderCraftCells3(MC.ui.invCtx.cellEls, cSlots);
            MC.updateCraft3(cSlots, res);
            MC.renderHotbar();
            MC.sfx.craft();
        };
    }
};

MC.openFurnace = function (bx, by, bz) {
    const panel = MC.ui['furn'];
    panel.innerHTML = "";
    const box = document.createElement("div");
    box.className = "mc-panel";
    box.style.position = "relative";
    const close = document.createElement("span");
    close.className = "mc-close-x"; close.textContent = "×";
    close.addEventListener("click", () => MC.closePanels());
    const title = document.createElement("h3"); title.textContent = "FURNACE";
    box.appendChild(close); box.appendChild(title);

    const furn = document.createElement("div");
    furn.className = "mc-furnace";
    const input = MC.mkSlot(0, () => {});
    const arrow = document.createElement("div");
    arrow.className = "mc-arrow"; arrow.textContent = "→";
    const fuel = MC.mkSlot(1, () => {});
    const out = MC.mkSlot(2, () => {});
    furn.appendChild(input); furn.appendChild(arrow); furn.appendChild(fuel); furn.appendChild(out);
    const timing = document.createElement("div");
    timing.style.cssText = "grid-column: 1 / -1;";
    const prog = document.createElement("div");
    prog.className = "mc-progress";
    const bar = document.createElement("div");
    prog.appendChild(bar);
    timing.appendChild(prog);
    furn.appendChild(timing);
    box.appendChild(furn);

    const fuelLegend = document.createElement("div");
    fuelLegend.style.cssText = "font-size:12px;color:#8aa0bb;margin-top:8px;";
    fuelLegend.innerHTML = "FUEL: coal=8 · log/planks=1.5 · stick=0.5 &nbsp;|&nbsp; SMELT: iron→ingot, gold→ingot, sand→glass, log→coal";
    box.appendChild(fuelLegend);

    const invWrap = document.createElement("div");
    invWrap.style.display = "grid"; invWrap.style.gap = "6px"; invWrap.style.marginTop = "12px";
    invWrap.appendChild(MC.buildSlotsGrid(9, 27, 9, (idx) => MC.pickSlot(idx)));
    const hbRow = MC.buildSlotsGrid(0, 9, 9, (idx) => MC.pickSlot(idx));
    invWrap.appendChild(hbRow);
    box.appendChild(invWrap);

    panel.appendChild(box);
    MC.furnace = { x: bx, y: by, z: bz, input: 0, fuel: 0, out: 0, fuelT: 0, itemT: 0, state: 0 };
    MC.setPanel("furn");
    document.exitPointerLock && document.exitPointerLock();
    MC.furnaceEls = { input, fuel, out, bar };
};

MC.mkSlot = function (idx, onClick) {
    const d = document.createElement("div");
    d.className = "mc-slot";
    return d;
};

MC.renderFurnace = function () {
    const f = MC.furnace;
    if (!f) return;
    const { input, fuel, out, bar } = MC.furnaceEls;
    input.innerHTML = ""; fuel.innerHTML = ""; out.innerHTML = "";
    const draw = (el, id) => {
        if (id > 0) {
            const ic = document.createElement("canvas");
            ic.className = "mc-ic"; ic.width = ic.height = 32;
            const g = ic.getContext("2d");
            g.imageSmoothingEnabled = false;
            g.drawImage(MC.atlasCanvas, ...MC.uvrect(MC.itemTexture(id)), 0, 0, 32, 32);
            el.appendChild(ic);
        }
    };
    const fuelIcon = f.fuelT > 0 ? MC.anyFuelId() : 0;
    const outIcon = f.state && f.input > 0 ? MC.SMELTING[f.input] : 0;
    draw(input, f.input); draw(fuel, fuelIcon); draw(out, outIcon);
    bar.style.width = (f.state ? Math.min(100, (f.itemT / 10) * 100) : 0) + "%";
};
MC.anyFuelId = function () {
    const keys = Object.keys(MC.FUEL);
    return keys.length ? +keys[0] : 0;
};

MC.tickFurnace = function (dt) {
    const f = MC.furnace;
    if (!f) return;
    f.renderT = (f.renderT || 0) + dt;
    if (f.renderT > 0.4) { f.renderT = 0; MC.renderFurnace(); }

    // pick the first smeltable input from the player inventory
    let inputId = 0;
    for (let i = 0; i < 36; i++) {
        const s = MC.player.inventory[i];
        if (s.id > 0 && MC.SMELTING[s.id]) { inputId = s.id; break; }
    }
    if (inputId === 0) { f.input = 0; f.itemT = 0; return; }
    f.input = inputId;
    const outId = MC.SMELTING[inputId];

    // refuel when empty
    if (f.fuelT <= 0) {
        f.fuelT = 0;
        for (let i = 0; i < 36; i++) {
            const s = MC.player.inventory[i];
            const fu = MC.FUEL[s.id];
            if (fu) {
                f.fuelT = fu;
                s.count -= 1;
                if (s.count <= 0) { s.id = 0; s.count = 0; }
                MC.renderHotbar();
                break;
            }
        }
    }

    if (f.fuelT <= 0) { f.state = 0; return; }
    f.state = 1;
    f.fuelT -= dt;
    f.itemT += dt;
    if (f.itemT >= 10) {
        f.itemT = 0;
        // consume one input
        for (let i = 0; i < 36; i++) {
            const s = MC.player.inventory[i];
            if (s.id === f.input) {
                s.count -= 1;
                if (s.count <= 0) { s.id = 0; s.count = 0; }
                MC.renderHotbar();
                break;
            }
        }
        MC.player.addItem(outId, 1);
        MC.sfx.level();
    }
};

MC.showToastHelp = function (msg) { MC.ui.helpToast = msg; };

/* =========================================================
   05 · INTERACTION IN WORLD
   ======================================================== */
MC.tryInteract = function (dt) {
    const p = MC.player;
    const eye = [p.pos[0], p.pos[1] + MC.EYE, p.pos[2]];
    const fwd = MC.dirFromAngles(p.yaw, p.pitch);
    const reach = MC.pointReach[p.mode] || 5;
    const hit = MC.raycast(eye, fwd, reach);
    const inp = MC.input;

    // LEFT: mine / attack
    if (inp.mousedown & 1) {
        // mob attack
        const mob = MC.rayMob(eye, fwd, reach);
        if (mob) {
            const tool = MC.toolKind(p.getHeld().id);
            const dmg = (tool === "sword") ? 4 : 2;
            mob.hp -= dmg;
            mob.wanderDx = fwd[0] * 3; mob.wanderDz = fwd[2] * 3;
            MC.spawnParticles(mob.x, mob.y + 0.5, mob.z, [255, 60, 60], 4);
            MC.sfx.hurt();
            if (mob.hp <= 0) {
                MC.runStats.mobsSlain = (MC.runStats.mobsSlain || 0) + 1;
                spawnDropForMob(mob);
            }
            return;
        }
        if (hit) {
            MC.playerBreakBlock(p, hit);
            MC.runStats.blocksMined = (MC.runStats.blocksMined || 0) + 1;
        } else {
            p.breakProgress = 0;
            p.breakTarget = null;
        }
    } else {
        p.breakProgress = 0;
        p.breakTarget = null;
    }

    // RIGHT: place / use
    if ((inp.mousedown & 2) && p.interactCooldown <= 0) {
        if (hit) {
            const id = MC.world.getBlock(hit.x, hit.y, hit.z);
            if (id === B_CRAFT) { MC.openCraftTable(); p.interactCooldown = 0.3; return; }
            if (id === B_FURNACE) { MC.openFurnace(hit.x, hit.y, hit.z); p.interactCooldown = 0.3; return; }
            const held = p.getHeld();
            if (held.id > 0 && held.id <= 22 && BLOCKS[held.id] && !BLOCKS[held.id].water) {
                MC.placeSelected(p, hit, held.id);
                MC.runStats.blocksPlaced = (MC.runStats.blocksPlaced || 0) + 1;
            }
        }
        p.interactCooldown = 0.15;
    }
    if (p.interactCooldown > 0) p.interactCooldown -= dt;
};

function spawnDropForMob(mob) {
    const dropIds = [B_WOOL, B_WOOL, I_STICK, B_BRICK];
    const id = dropIds[(Math.random() * dropIds.length) | 0];
    MC.spawnItemEntity(Math.floor(mob.x), Math.floor(mob.y), Math.floor(mob.z), id, 1 + ((Math.random() * 2) | 0));
}

MC.rayMob = function (origin, dir, maxDist) {
    let best = null, bestT = Infinity;
    for (const m of MC.mobs) {
        const dx = m.x - origin[0], dy = m.y + 0.8 - origin[1], dz = m.z - origin[2];
        const dot = dx * dir[0] + dy * dir[1] + dz * dir[2];
        if (dot < 0 || dot > maxDist) continue;
        const px = origin[0] + dir[0] * dot, py = origin[1] + dir[1] * dot, pz = origin[2] + dir[2] * dot;
        const rad = Math.max(m.scale * 0.8, 0.3);
        const dx2 = px - m.x, dy2 = py - (m.y + 0.5), dz2 = pz - m.z;
        if (dx2 * dx2 + dy2 * dy2 + dz2 * dz2 <= rad * rad * 2) {
            if (dot < bestT) { bestT = dot; best = m; }
        }
    }
    return best;
};

/* =========================================================
   05 · GAME LOOP
   ======================================================== */
MC.loopStarted = false;
MC.loopAccum = 0;
MC.lastT = 0;

MC.startLoop = function () {
    if (MC.loopStarted) return;
    MC.loopStarted = true;
    MC.lastT = performance.now();
    const frame = (now) => {
        const dtraw = Math.min(0.1, (now - MC.lastT) / 1000);
        MC.lastT = now;
        MC.loopAccum += dtraw;
        const dt = MC.loopAccum > 0.3 ? 0.02 : MC.loopAccum;
        MC.loopAccum = 0;
        MC.frame(dt);
        requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
};

MC.frame = function (dt) {
    try {
        if (MC.state.running && MC.state.mode) {
            MC.step(dt);
            MC.renderFrame(dt);
            MC.tickFurnace(dt);
            // HUD
            MC.renderHotbar();
            MC.renderBars();
            MC.tickClock();
            // player hurt flash
            if (MC.player.hurtTimer > 0) {
                MC.ui['flash'].style.opacity = Math.min(0.7, MC.player.hurtTimer * 2);
            } else {
                MC.ui['flash'].style.opacity = 0;
            }
            // selected block box
            const eye = [MC.player.pos[0], MC.player.pos[1] + MC.EYE, MC.player.pos[2]];
            const fwd = MC.dirFromAngles(MC.player.yaw, MC.player.pitch);
            MC.updateSelectorBox(MC.gfx.view, MC.gfx.proj, eye, fwd);
        }
    } catch (e) {
        if (!MC._frameErrShown) { MC._frameErrShown = true; console.error('[Minecraft Quest render]', e); MC.showErr("Render error: " + (e && e.message || e)); }
    }
    // mouse rotate
    if (MC.input.locked && MC.state.running && MC.player && !MC.ui.panel) {
        MC.player.yaw -= MC.input.mouseDX * 0.0026;
        MC.player.pitch = MC.clamp(MC.player.pitch - MC.input.mouseDY * 0.0026, -1.55, 1.55);
    }
    MC.input.mouseDX = 0; MC.input.mouseDY = 0;
};

MC.toggleFly = function () {
    const p = MC.player;
    if (p.mode !== "creative") return;
    p.flying = !p.flying;
    if (p.flying) p.vel[1] = 0;
    MC.toast(p.flying ? "Fly enabled" : "Fly disabled", 900);
};

/* =========================================================
   05 · INPUT BINDINGS
   ======================================================== */
MC.bindInput = function () {
    const root = document;
    const down = (e) => {
        if (!MC.overlay || MC.overlay.classList.contains("hidden")) return;
        if (e.repeat) return;
        const p = MC.player;
        // hotbar keys
        if (e.code >= "Digit1" && e.code <= "Digit9" && p) {
            const n = parseInt(e.code.slice(5), 10);
            p.hotbarSlot = n - 1;
            return;
        }
        if (e.code === "Space") {
            const n = performance.now();
            if (p && p.mode === "creative" && (n - (p.lastSpace || 0)) < 350 && !p.flying) {
                MC.toggleFly();
            }
            p.lastSpace = n;
        }
        if (e.code === "KeyE" && MC.state.running) {
            if (!MC.ui.panel) { MC.openInventory(); }
            else if (MC.ui.panel === "inv") { MC.closePanels(); }
            return;
        }
        if (e.code === "F3") {
            MC.ui['fcode'].classList.toggle("hidden");
            return;
        }
        if (e.code === "Escape") {
            // pointer lock handles pause; second escape handled by lock exit flow
            return;
        }
        MC.input.keys.add(e.code);
    };
    const up = (e) => { MC.input.keys.delete(e.code); };

    root.addEventListener("keydown", down);
    root.addEventListener("keyup", up);

    root.addEventListener("mousemove", (e) => {
        if (MC.input.locked) {
            MC.input.mouseDX += e.movementX || 0;
            MC.input.mouseDY += e.movementY || 0;
        }
    });

    root.addEventListener("mousedown", (e) => {
        if (!MC.state.running || MC.ui.panel) return;
        if (e.button === 0) MC.input.mousedown |= 1;
        if (e.button === 2) MC.input.mousedown |= 2;
    });
    root.addEventListener("mouseup", (e) => {
        if (e.button === 0) MC.input.mousedown &= ~1;
        if (e.button === 2) MC.input.mousedown &= ~2;
    });
    root.addEventListener("contextmenu", (e) => {
        if (MC.overlay && !MC.overlay.classList.contains("hidden")) e.preventDefault();
    });

    // wheel hotbar
    root.addEventListener("wheel", (e) => {
        if (!MC.player || !MC.state.running || MC.ui.panel) return;
        MC.player.hotbarSlot = (MC.player.hotbarSlot + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
    });
};


/* =========================================================
   05 · OPEN / CLOSE THE GAME
   ======================================================== */
MC.showOverlay = function () {
    if (!MC.uiBuilt) { MC.makeUI(); MC.uiBuilt = true; }
    MC.overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    MC.state.running = false;
    MC.hidePause();
    // fresh menu state
    MC.ui['menu'].classList.remove("hidden");
    MC.refreshMenu();
};

MC.openMinecraft = function () {
    MC.showOverlay();
    // match modal pattern of other games: record a play
    if (window.recordArcadePlay && !MC.playRecorded) {
        try { window.recordArcadePlay(); } catch (e) {}
        MC.playRecorded = true;
    }
    try {
        if (window.openModal) {
            const arcadePage = document.getElementById("arcade");
            MC.arcadeRef = null;
        }
    } catch (e) {}
};

MC.boot = function () {
    console.log("Minecraft Quest v" + MC.VERSION + " boot");
    MC.injectCSS();
    MC.bindInput();
    // wire arcade integration
    MC.wireArcade();
    // expose to arcade records
    try {
        if (window.ARCADE_GAMES && !window.ARCADE_GAMES["minecraft-quest"]) {
            window.ARCADE_GAMES["minecraft-quest"] = { label: "MINECRAFT QUEST", mode: "max" };
        }
    } catch (e) {}
};

MC.wireArcade = function () {
    const btn = document.getElementById("playMinecraftQuest");
    if (btn) btn.addEventListener("click", MC.openMinecraft);
};

// auto-boot on DOM ready
if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", MC.boot);
    } else {
        MC.boot();
    }
}
// [END]