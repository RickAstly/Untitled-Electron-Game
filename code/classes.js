"use strict";
class Level {
    constructor(data) {
        this.storage = new Map();
        this.format = consts.VERSION;
        this.resources = {};
        if (typeof data != "object") {
            this.seed = data ?? 0;
            this.uuid = Math.random().toString().substring(2);
            this.generateNecessaryChunks();
            this.buildBuilding(0, 0, BuildingID["0x0008"]);
            this.buildBuilding(0, -1, BuildingID["0x0008"]);
            this.buildBuilding(-1, 0, BuildingID["0x0008"]);
            this.buildBuilding(-1, -1, BuildingID["0x0008"]);
        }
        else {
            let { chunks, resources, seed, version, uuid } = data;
            this.seed = seed;
            this.resources = resources;
            this.uuid = uuid;
            let position, chunkData;
            try {
                for ([position, chunkData] of Object.entries(chunks)) {
                    chunkData.version = version;
                    this.storage.set(position, new Chunk({
                        x: parseInt(position.split(",")[0]), y: parseInt(position.split(",")[1]),
                        seed: seed, parent: this
                    }, chunkData).generate());
                }
            }
            catch (err) {
                throw new Error(`Error loading chunk ${position}: ${parseError(err)}`);
            }
        }
    }
    hasChunk(tileX, tileY) {
        return !!this.storage.get(`${Pos.tileToChunk(tileX)},${Pos.tileToChunk(tileY)}`);
    }
    getChunk(tileX, tileY) {
        if (!this.hasChunk(tileX, tileY)) {
            this.generateChunk(Pos.tileToChunk(tileX), Pos.tileToChunk(tileY));
        }
        return this.storage.get(`${Pos.tileToChunk(tileX)},${Pos.tileToChunk(tileY)}`);
    }
    generateChunk(x, y) {
        if (this.storage.get(`${x},${y}`)) {
            return;
        }
        this.storage.set(`${x},${y}`, new Chunk({ x, y, seed: this.seed, parent: this })
            .generate());
    }
    generateNecessaryChunks() {
        let xOffset = -Math.floor((Game.scroll.x * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
        let yOffset = -Math.floor((Game.scroll.y * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
        this.generateChunk(xOffset - 1, yOffset - 1);
        this.generateChunk(xOffset, yOffset - 1);
        this.generateChunk(xOffset + 1, yOffset - 1);
        this.generateChunk(xOffset - 1, yOffset);
        this.generateChunk(xOffset, yOffset);
        this.generateChunk(xOffset + 1, yOffset);
        this.generateChunk(xOffset - 1, yOffset + 1);
        this.generateChunk(xOffset, yOffset + 1);
        this.generateChunk(xOffset + 1, yOffset + 1);
        this.generateChunk(xOffset + 2, yOffset - 1);
        this.generateChunk(xOffset + 2, yOffset);
        this.generateChunk(xOffset + 2, yOffset + 1);
        this.generateChunk(xOffset + 3, yOffset - 1);
        this.generateChunk(xOffset + 3, yOffset);
        this.generateChunk(xOffset + 3, yOffset + 1);
    }
    tileAtByPixel(pixelX, pixelY) {
        return this.getChunk(Pos.pixelToTile(pixelX), Pos.pixelToTile(pixelY)).tileAt(Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelX)), Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelY)));
    }
    tileAtByTile(tileX, tileY) {
        return this.getChunk(tileX, tileY).tileAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
    }
    setTileByTile(tileX, tileY, tile) {
        this.getChunk(tileX, tileY).setTile(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), tile);
        Game.forceRedraw = true;
        return true;
    }
    buildingIDAtPixel(pixelX, pixelY) {
        return this.getChunk(Pos.pixelToTile(pixelX), Pos.pixelToTile(pixelY)).buildingAt(Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelX)), Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelY)))?.id ?? BuildingID["0xFFFF"];
    }
    buildingIDAtTile(tileX, tileY) {
        return this.getChunk(tileX, tileY).buildingAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY))?.id ?? BuildingID["0xFFFF"];
    }
    buildingAtTile(tileX, tileY) {
        return this.getChunk(tileX, tileY).buildingAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
    }
    buildingAtPixel(pixelX, pixelY) {
        return this.getChunk(Pos.pixelToTile(pixelX), Pos.pixelToTile(pixelY)).buildingAt(Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelX)), Pos.chunkOffsetInTiles(Pos.pixelToTile(pixelY)));
    }
    buildingAtPos(pos) {
        return this.getChunk(pos.tileX, pos.tileY).buildingAt(pos.chunkOffsetXInTiles, pos.chunkOffsetYInTiles);
    }
    extractorAtTile(tileX, tileY) {
        return this.getChunk(Math.floor(tileX), Math.floor(tileY)).extractorAt(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY));
    }
    extractorAtPos(pos) {
        return this.getChunk(pos.tileX, pos.tileY).extractorAt(pos.chunkOffsetXInTiles, pos.chunkOffsetYInTiles);
    }
    writeBuilding(tileX, tileY, building) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setBuilding(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    writeExtractor(tileX, tileY, building) {
        if (this.getChunk(tileX, tileY)) {
            this.getChunk(tileX, tileY).setExtractor(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), building);
            Game.forceRedraw = true;
            return true;
        }
        return false;
    }
    displayGhostBuilding(tileX, tileY, buildingID, currentframe) {
        tileX = Math.floor(tileX);
        tileY = Math.floor(tileY);
        if (!this.hasChunk(tileX, tileY)) {
            return;
        }
        let id = buildingID;
        const meta = +buildingID >> 8;
        if (getRawBuildingID(buildingID) == "0x01" && [0, 1, 2, 3].includes(meta)) {
            id = this.getTurnedConveyor(tileX, tileY, meta);
        }
        this.getChunk(tileX, tileY).displayGhostBuilding(Pos.chunkOffsetInTiles(tileX), Pos.chunkOffsetInTiles(tileY), id, !registry.buildings[getRawBuildingID(buildingID)]?.canBuildAt(tileX, tileY, this), currentframe);
    }
    getTurnedConveyor(tileX, tileY, conveyorType) {
        if (registry.keybinds.placement.force_straight_conveyor.isHeld()) {
            return hex((conveyorType * 0x100) + 1, 4);
        }
        tileX = Math.floor(tileX);
        tileY = Math.floor(tileY);
        function isOutputBuilding(buildingid) {
            return ["0x0002", "0x0004", "0x0007", "0x0009", "0x000A", "0x000B", "0x0011"].includes(buildingid);
        }
        let leftBuilding = this.buildingIDAtTile(tileX - 1, tileY);
        let hasLeftBuilding = ["0x0001", "0x0401", "0x0501", "0x0C01", "0x0D01"].includes(leftBuilding)
            || isOutputBuilding(leftBuilding);
        let topBuilding = this.buildingIDAtTile(tileX, tileY - 1);
        let hasTopBuilding = ["0x0101", "0x0601", "0x0701", "0x0E01", "0x0F01"].includes(topBuilding)
            || isOutputBuilding(topBuilding);
        let rightBuilding = this.buildingIDAtTile(tileX + 1, tileY);
        let hasRightBuilding = ["0x0201", "0x0801", "0x0901", "0x1001", "0x1101"].includes(rightBuilding)
            || isOutputBuilding(rightBuilding);
        let bottomBuilding = this.buildingIDAtTile(tileX, tileY + 1);
        let hasBottomBuilding = ["0x0301", "0x0A01", "0x0B01", "0x1201", "0x1301"].includes(bottomBuilding)
            || isOutputBuilding(bottomBuilding);
        switch (conveyorType) {
            case 0:
                if (hasLeftBuilding) {
                    if (hasTopBuilding && hasBottomBuilding) {
                        return BuildingID["0x1801"];
                    }
                    else if (hasTopBuilding) {
                        return BuildingID["0x0D01"];
                    }
                    else if (hasBottomBuilding) {
                        return BuildingID["0x0C01"];
                    }
                    else {
                        return BuildingID["0x0001"];
                    }
                }
                else {
                    if (hasTopBuilding && hasBottomBuilding) {
                        return BuildingID["0x1401"];
                    }
                    else if (hasTopBuilding) {
                        return BuildingID["0x0501"];
                    }
                    else if (hasBottomBuilding) {
                        return BuildingID["0x0401"];
                    }
                    else {
                        return BuildingID["0x0001"];
                    }
                }
                break;
            case 1:
                if (hasTopBuilding) {
                    if (hasLeftBuilding && hasRightBuilding) {
                        return BuildingID["0x1901"];
                    }
                    else if (hasLeftBuilding) {
                        return BuildingID["0x0F01"];
                    }
                    else if (hasRightBuilding) {
                        return BuildingID["0x0E01"];
                    }
                    else {
                        return BuildingID["0x0101"];
                    }
                }
                else {
                    if (hasLeftBuilding && hasRightBuilding) {
                        return BuildingID["0x1501"];
                    }
                    else if (hasLeftBuilding) {
                        return BuildingID["0x0701"];
                    }
                    else if (hasRightBuilding) {
                        return BuildingID["0x0601"];
                    }
                    else {
                        return BuildingID["0x0101"];
                    }
                }
                break;
            case 2:
                if (hasRightBuilding) {
                    if (hasTopBuilding && hasBottomBuilding) {
                        return BuildingID["0x1A01"];
                    }
                    else if (hasTopBuilding) {
                        return BuildingID["0x1101"];
                    }
                    else if (hasBottomBuilding) {
                        return BuildingID["0x1001"];
                    }
                    else {
                        return BuildingID["0x0201"];
                    }
                }
                else {
                    if (hasTopBuilding && hasBottomBuilding) {
                        return BuildingID["0x1601"];
                    }
                    else if (hasTopBuilding) {
                        return BuildingID["0x0901"];
                    }
                    else if (hasBottomBuilding) {
                        return BuildingID["0x0801"];
                    }
                    else {
                        return BuildingID["0x0201"];
                    }
                }
                break;
            case 3:
                if (hasBottomBuilding) {
                    if (hasLeftBuilding && hasRightBuilding) {
                        return BuildingID["0x1B01"];
                    }
                    else if (hasLeftBuilding) {
                        return BuildingID["0x1301"];
                    }
                    else if (hasRightBuilding) {
                        return BuildingID["0x1201"];
                    }
                    else {
                        return BuildingID["0x0301"];
                    }
                }
                else {
                    if (hasLeftBuilding && hasRightBuilding) {
                        return BuildingID["0x1701"];
                    }
                    else if (hasLeftBuilding) {
                        return BuildingID["0x0B01"];
                    }
                    else if (hasRightBuilding) {
                        return BuildingID["0x0A01"];
                    }
                    else {
                        return BuildingID["0x0301"];
                    }
                }
                break;
        }
    }
    buildBuilding(tileX, tileY, buildingID) {
        if (this.buildingIDAtTile(tileX, tileY) == "0x0008")
            return false;
        if (getRawBuildingID(buildingID) == "0x05") {
            if (this.extractorAtTile(tileX, tileY)?.id == buildingID) {
                if (!canOverwriteBuilding)
                    return false;
                canOverwriteBuilding = false;
            }
            this.extractorAtTile(tileX, tileY)?.break();
        }
        else {
            if (this.buildingAtTile(tileX, tileY)?.id == buildingID) {
                if (!canOverwriteBuilding)
                    return false;
                canOverwriteBuilding = false;
            }
            this.buildingAtTile(tileX, tileY)?.break();
            this.extractorAtTile(tileX, tileY)?.break();
        }
        let tempBuilding;
        if (buildingID == "0xFFFF") {
            return true;
        }
        if (((+buildingID) & 0x00F0) == 0x10) {
            this.buildingAtTile(tileX + 1, tileY)?.break();
            this.buildingAtTile(tileX, tileY + 1)?.break();
            this.buildingAtTile(tileX + 1, tileY + 1)?.break();
            switch (getRawBuildingID(buildingID)) {
                case "0x11":
                    let controller = new registry.buildings[getRawBuildingID(buildingID)](tileX, tileY, buildingID, this);
                    let secondary1 = new MultiBlockSecondary(tileX + 1, tileY, BuildingID["0x0010"], this);
                    let secondary2 = new MultiBlockSecondary(tileX, tileY + 1, BuildingID["0x0010"], this);
                    let secondary3 = new MultiBlockSecondary(tileX + 1, tileY + 1, BuildingID["0x0010"], this);
                    controller.secondaries = [secondary1, secondary2, secondary3];
                    [secondary1, secondary2, secondary3].forEach(secondary => secondary.controller = controller);
                    this.writeBuilding(tileX, tileY, controller);
                    this.writeBuilding(tileX + 1, tileY, secondary1);
                    this.writeBuilding(tileX, tileY + 1, secondary2);
                    this.writeBuilding(tileX + 1, tileY + 1, secondary3);
                    break;
                default:
                    return false;
            }
            return true;
        }
        if (registry.buildings[getRawBuildingID(buildingID)]?.canBuildAt(tileX, tileY, this)) {
            trigger(triggerType.placeBuilding, getRawBuildingID(buildingID));
            tempBuilding = new registry.buildings[getRawBuildingID(buildingID)](tileX, tileY, getRawBuildingID(buildingID) == "0x01" ?
                this.getTurnedConveyor(tileX, tileY, +buildingID >> 8) : buildingID, this);
        }
        else {
            trigger(triggerType.placeBuildingFail, getRawBuildingID(buildingID));
            return false;
        }
        if (tempBuilding instanceof Extractor) {
            return this.writeExtractor(tileX, tileY, tempBuilding);
        }
        else {
            return this.writeBuilding(tileX, tileY, tempBuilding);
        }
    }
    update(currentFrame) {
        for (let chunk of this.storage.values()) {
            chunk.update(currentFrame);
        }
    }
    display(currentframe) {
        for (let chunk of this.storage.values()) {
            chunk.display(currentframe);
        }
    }
    displayTooltip(mousex, mousey, currentframe) {
        if (!currentframe.tooltip) {
            return;
        }
        let x = (mousex - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
        let y = (mousey - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE;
        ctx4.font = "16px monospace";
        if (this.buildingAtPixel(x, y) instanceof Building) {
            let buildingID = getRawBuildingID(this.buildingIDAtPixel(x, y));
            if (buildingID == "0x01" && this.buildingAtPixel(x, y).item) {
                let item = this.buildingAtPixel(x, y).item;
                if (item && (Math.abs(item.pos.pixelX - x) < 8) && Math.abs(item.pos.pixelY - y) < 8) {
                    ctx4.fillStyle = "#0033CC";
                    ctx4.fillRect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
                    ctx4.strokeStyle = "#000000";
                    ctx4.strokeRect(mousex, mousey, (names.item[item.id] ?? item.id).length * 10, 16);
                    ctx4.fillStyle = "#FFFFFF";
                    ctx4.fillText((names.item[item.id] ?? item.id), mousex + 2, mousey + 10);
                    return;
                }
            }
            ctx4.fillStyle = "#0033CC";
            ctx4.fillRect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
            ctx4.strokeStyle = "#000000";
            ctx4.strokeRect(mousex, mousey, (names.building[buildingID] ?? buildingID).length * 10, 16);
            ctx4.fillStyle = "#FFFFFF";
            ctx4.fillText((names.building[buildingID] ?? buildingID), mousex + 2, mousey + 10);
            return;
        }
        let tileID = this.tileAtByPixel(x, y);
        ctx4.fillStyle = "#0033CC";
        ctx4.fillRect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
        ctx4.strokeStyle = "#000000";
        ctx4.strokeRect(mousex, mousey, (names.tile[tileID] ?? tileID).length * 10, 16);
        ctx4.fillStyle = "#FFFFFF";
        ctx4.fillText((names.tile[tileID] ?? tileID), mousex + 2, mousey + 10);
        return;
    }
    export() {
        let chunkOutput = {};
        for (let [position, chunk] of this.storage.entries()) {
            let output = chunk.export();
            if (output) {
                chunkOutput[position] = output;
            }
        }
        return {
            chunks: chunkOutput,
            resources: this.resources,
            seed: this.seed,
            version: consts.VERSION,
            uuid: this.uuid
        };
    }
}
class Chunk {
    constructor({ x, y, seed, parent }, data) {
        this.hasBuildings = false;
        this.x = x;
        this.y = y;
        this.parent = parent;
        let tweakedX = x == 0 ? 5850 : x;
        let tweakedY = y == 0 ? 9223 : y;
        this.chunkSeed = Math.abs((((tweakedX) ** 3) * (tweakedY ** 5) + 3850 + ((seed - 314) * 11)) % (2 ** 16));
        this._generator = pseudoRandom(this.chunkSeed);
        this.layers = [
            [],
            [],
            []
        ];
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[0][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[0][x].push("base_null");
            }
        }
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[1][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[1][x].push(null);
            }
        }
        for (let x = 0; x < consts.CHUNK_SIZE; x++) {
            this.layers[2][x] = [];
            for (let z = 0; z < consts.CHUNK_SIZE; z++) {
                this.layers[2][x].push(null);
            }
        }
        if (data) {
            if (+data.version.split(" ")[1].replaceAll(".", "") < 200) {
                data.layers = data;
            }
            for (let y in data.layers[0]) {
                for (let x in data.layers[0][y]) {
                    let buildingData = data.layers[0][y][x];
                    if (!buildingData)
                        continue;
                    this.hasBuildings = true;
                    if (+data.version.split(" ")[1].replaceAll(".", "") <= 200) {
                        buildingData.id = hex(buildingData.id, 4);
                    }
                    let tempBuilding;
                    try {
                        tempBuilding = new registry.buildings[getRawBuildingID(buildingData.id)](parseInt(x) + (consts.CHUNK_SIZE * this.x), parseInt(y) + (consts.CHUNK_SIZE * this.y), buildingData.id, this.parent);
                    }
                    catch (err) {
                        console.error(err);
                        throw new Error(`Failed to import building id ${buildingData.id} at position ${x},${y} in chunk ${this.x},${this.y}. See console for more details.`);
                    }
                    if (buildingData.item) {
                        tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id);
                        tempBuilding.item.grabbedBy = tempBuilding;
                    }
                    if (buildingData.inv && tempBuilding instanceof StorageBuilding) {
                        for (let itemData of buildingData.inv) {
                            let tempItem = new Item(itemData.x, itemData.y, itemData.id);
                            tempItem.grabbedBy = tempBuilding;
                            tempBuilding.inventory.push(tempItem);
                        }
                    }
                    this.layers[1][y][x] = tempBuilding;
                }
            }
            for (let y in data.layers[1]) {
                for (let x in data.layers[1][y]) {
                    let buildingData = data.layers[1][y][x];
                    if (!buildingData)
                        continue;
                    this.hasBuildings = true;
                    if (+data.version.split(" ")[1].replaceAll(".", "") <= 200) {
                        buildingData.id = hex(buildingData.id, 4);
                    }
                    let tempBuilding = new Extractor(parseInt(x) + Pos.chunkToTile(this.x), parseInt(y) + Pos.chunkToTile(this.y), buildingData.id, this.parent);
                    if (buildingData.item && +data.version.split(" ")[1].replaceAll(".", "") >= 130) {
                        tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id);
                        tempBuilding.item.grabbedBy = tempBuilding;
                    }
                    this.layers[2][y][x] = tempBuilding;
                }
            }
        }
        return this;
    }
    update(currentFrame) {
        if (!this.hasBuildings)
            return this;
        for (let row of this.layers[1]) {
            for (let value of row) {
                value?.update?.(currentFrame);
            }
        }
        for (let row of this.layers[2]) {
            for (let value of row) {
                value?.update?.();
            }
        }
        return this;
    }
    tileAt(tileX, tileY) {
        return this.layers[0][tileY]?.[tileX] ?? (() => { throw new Error(`Tile ${tileX}, ${tileY} does not exist!`); })();
    }
    buildingAt(tileX, tileY) {
        return this.layers[1][tileY]?.[tileX] ?? null;
    }
    extractorAt(tileX, tileY) {
        return this.layers[2][tileY]?.[tileX] ?? null;
    }
    setTile(tileX, tileY, value) {
        try {
            this.tileAt(tileX, tileY);
        }
        catch (err) {
            return false;
        }
        this.layers[0][tileY][tileX] = value;
        return true;
    }
    setBuilding(tileX, tileY, value) {
        if (this.tileAt(tileX, tileY) == null) {
            return false;
        }
        this.layers[1][tileY][tileX] = value;
        if (value instanceof Building)
            this.hasBuildings = true;
        return true;
    }
    setExtractor(tileX, tileY, value) {
        if (this.tileAt(tileX, tileY) == null) {
            return false;
        }
        this.layers[2][tileY][tileX] = value;
        if (value instanceof Building)
            this.hasBuildings = true;
        return true;
    }
    displayToConsole() {
        console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
        console.table(this.layers[0]);
    }
    generator() {
        return this._generator.next().value;
    }
    generate() {
        let isWet = false;
        let isHilly = false;
        let distanceFromSpawn = Math.sqrt(this.x ** 2 + this.y ** 2);
        let distanceBoost = constrain(Math.log((distanceFromSpawn / generation_consts.ore_scale) + 0.5) / 2, 0, 0.6);
        if (this.generator().chance(0.07) && distanceFromSpawn > generation_consts.min_water_chunk_distance) {
            isWet = true;
        }
        else if (distanceBoost > generation_consts.hilly.terrain_cutoff) {
            isHilly = true;
        }
        if (isWet) {
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
                    if (row == "0" || row == "15" || tile == "0" || tile == "15") {
                        this.layers[0][row][tile] = "base_water";
                    }
                    else if (row == "1" || row == "14" || tile == "1" || tile == "14") {
                        this.layers[0][row][tile] = this.generator().chance(0.5) ? "base_water" : "base_stone";
                    }
                    else {
                        this.layers[0][row][tile] =
                            this.generator().chance(0.1) ?
                                (this.generator().chance(0.3) ? "base_ore_iron" : "base_ore_coal")
                                : "base_stone";
                    }
                }
            }
        }
        else if (isHilly) {
            let oreToGenerate;
            let oreRand = this.generator();
            if (distanceFromSpawn < generation_consts.hilly.min_iron_distance) {
                oreToGenerate = "base_ore_coal";
            }
            else if (distanceFromSpawn < generation_consts.hilly.min_copper_distance) {
                oreToGenerate = oreRand.chance(0.5) ? "base_ore_iron" : "base_ore_coal";
            }
            else {
                oreToGenerate = oreRand.chance(0.5) ? (oreRand.chance(0.25) ? "base_ore_copper" : "base_ore_iron") : "base_ore_coal";
            }
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
                    let noiseHeight = Math.abs(noise.perlin2(((this.x * consts.CHUNK_SIZE) + +tile + this.parent.seed) / generation_consts.perlin_scale, ((this.y * consts.CHUNK_SIZE) + +row + (this.parent.seed + generation_consts.y_offset))
                        / generation_consts.perlin_scale));
                    if ((noiseHeight + distanceBoost / 2) > generation_consts.hilly.ore_threshold) {
                        this.layers[0][row][tile] = oreToGenerate;
                    }
                    else if ((noiseHeight + distanceBoost) > generation_consts.hilly.stone_threshold) {
                        this.layers[0][row][tile] = "base_stone";
                    }
                    else {
                        this.layers[0][row][tile] = "base_grass";
                    }
                }
            }
        }
        else {
            for (let row in this.layers[0]) {
                for (let tile in this.layers[0][row]) {
                    this.layers[0][row][tile] = "base_grass";
                }
            }
            let oreToGenerate;
            if (distanceFromSpawn < 3) {
                oreToGenerate = "base_ore_coal";
            }
            else {
                oreToGenerate = (this.generator().chance(0.5)) ? "base_ore_coal" : "base_ore_iron";
            }
            let hill_x = Math.floor(this.generator().value * 16);
            let hill_y = Math.floor(this.generator().value * 16);
            this.setTile(hill_x, hill_y, oreToGenerate);
            this.setTile(hill_x + 1, hill_y, "base_stone");
            this.setTile(hill_x - 1, hill_y, "base_stone");
            this.setTile(hill_x, hill_y + 1, "base_stone");
            this.setTile(hill_x, hill_y - 1, "base_stone");
            this.setTile(hill_x + 1, hill_y + 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
            this.setTile(hill_x + 1, hill_y - 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
            this.setTile(hill_x - 1, hill_y + 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
            this.setTile(hill_x - 1, hill_y - 1, this.generator().chance(0.5) ? "base_grass" : "base_stone");
        }
        return this;
    }
    display(currentframe) {
        if ((Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerWidth + 1 ||
            (Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE ||
            (Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerHeight + 1 ||
            (Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE)
            return;
        currentframe.cps++;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        if (currentframe.redraw) {
            for (let y = 0; y < this.layers[0].length; y++) {
                for (let x = 0; x < this.layers[0][y].length; x++) {
                    this.displayTile(x, y, currentframe);
                }
            }
        }
        for (let y = 0; y < this.layers[1].length; y++) {
            for (let x = 0; x < this.layers[1][y].length; x++) {
                if (this.layers[1][y][x] instanceof Building) {
                    this.layers[1][y][x].display(currentframe);
                }
            }
        }
        for (let y = 0; y < this.layers[2].length; y++) {
            for (let x = 0; x < this.layers[2][y].length; x++) {
                if (this.layers[2][y][x]) {
                    this.displayL3(x, y, this.layers[2][y][x].id);
                    this.layers[2][y][x].display(currentframe);
                }
            }
        }
        if (currentframe.debug) {
            ctx4.strokeStyle = "#0000FF";
            ctx4.strokeRect(this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE), this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE), consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE);
        }
    }
    displayTile(x, y, currentframe) {
        currentframe.tps++;
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
        const tile = this.tileAt(x, y);
        if (settings.graphics_mode || (tile != "base_grass")) {
            if (registry.textures.tile[tile]) {
                ctx.drawImage(registry.textures.tile[tile], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
            }
            else {
                ctx.fillStyle = "#FF00FF";
                rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.fillStyle = "#000000";
                rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
                ctx.font = "15px sans-serif";
                ctx.fillStyle = "#00FF00";
                ctx.fillText(tile.toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
            }
        }
        else {
            ctx.fillStyle = "#00CC33";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        }
        if (currentframe.debug)
            ctx.strokeRect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
    }
    displayGhostBuilding(x, y, buildingID, isError, currentframe) {
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
        let _ctx = ctx1;
        if (registry.keybinds.placement.break_building.isHeld()) {
            _ctx.globalAlpha = 0.9;
            _ctx.drawImage(registry.textures.misc["invalidunderlay"], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
            _ctx.globalAlpha = 1.0;
            return;
        }
        if (buildingID == "0xFFFF")
            return;
        _ctx.globalAlpha = 0.9;
        if (isError) {
            _ctx.drawImage(registry.textures.misc["invalidunderlay"], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
        }
        else {
            if ((+buildingID & 0x00F0) == 0x10) {
                _ctx.drawImage(registry.textures.misc["ghostunderlay"], pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE * 2);
            }
            else {
                _ctx.drawImage(registry.textures.misc["ghostunderlay"], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
            }
        }
        _ctx.globalAlpha = +buildingID % 0x100 == 0x01 ? 0.3 : 0.7;
        Building.prototype.display.bind({
            pos: Pos.fromTileCoords((this.x * consts.CHUNK_SIZE) + x, (this.y * consts.CHUNK_SIZE) + y, false),
            id: buildingID,
            level: this
        })(currentframe, ctx1);
        _ctx.globalAlpha = 1.0;
    }
    displayL3(x, y, buildingID, isGhost) {
        if (buildingID == "0xFFFF") {
            return;
        }
        let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
        let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
        let _ctx = ctx25;
        if (registry.textures.building[buildingID]) {
            switch (buildingID) {
                case "0x0005":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                case "0x0105":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                case "0x0205":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX - consts.DISPLAY_TILE_SIZE, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                case "0x0305":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                case "0x0405":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                case "0x0505":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                case "0x0605":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX - consts.DISPLAY_TILE_SIZE * 2, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                case "0x0705":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                case "0x0805":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                case "0x0905":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
                case "0x0A05":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX - consts.DISPLAY_TILE_SIZE * 3, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                case "0x0B05":
                    return _ctx.drawImage(registry.textures.building[buildingID], pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
            }
        }
        else {
            _ctx.fillStyle = "#FF00FF";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.fillStyle = "#000000";
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.font = "15px sans-serif";
            _ctx.fillStyle = "#00FF00";
            _ctx.fillText(buildingID, pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
        }
    }
    export() {
        let exportDataL1 = [];
        let hasBuildings = false;
        for (let row of this.layers[1]) {
            let tempRow = [];
            for (let building of row) {
                if (building instanceof Building) {
                    hasBuildings = true;
                }
                tempRow.push(building?.export() ?? null);
            }
            exportDataL1.push(tempRow);
        }
        let exportDataL2 = [];
        for (let row of this.layers[2]) {
            let tempRow = [];
            for (let extractor of row) {
                if (extractor instanceof Extractor) {
                    hasBuildings = true;
                }
                tempRow.push(extractor?.export() ?? null);
            }
            exportDataL2.push(tempRow);
        }
        if (hasBuildings) {
            return {
                layers: [exportDataL1, exportDataL2],
                version: consts.VERSION,
            };
        }
        else {
            return null;
        }
    }
}
class Item {
    constructor(x, y, id) {
        this.id = id;
        this.grabbedBy = null;
        this.deleted = false;
        this.pos = Pos.fromPixelCoords(x, y);
    }
    update(currentframe) {
    }
    display(currentframe) {
        if (consts.DISPLAY_SCALE * (this.pos.pixelX + Game.scroll.x - 8) < 0 ||
            consts.DISPLAY_SCALE * (this.pos.pixelX + Game.scroll.x - 8) > window.innerWidth ||
            consts.DISPLAY_SCALE * (this.pos.pixelY + Game.scroll.y - 8) < 0 ||
            consts.DISPLAY_SCALE * (this.pos.pixelY + Game.scroll.y - 8) > window.innerHeight) {
            return;
        }
        currentframe.ips++;
        ctx3.drawImage(registry.textures.item[this.id], this.pos.pixelX * consts.DISPLAY_SCALE + (Game.scroll.x * consts.DISPLAY_SCALE) - 8 * consts.DISPLAY_SCALE, this.pos.pixelY * consts.DISPLAY_SCALE + (Game.scroll.y * consts.DISPLAY_SCALE) - 8 * consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE);
    }
    export() {
        if (this.deleted || !this.grabbedBy)
            return null;
        return {
            id: this.id,
            x: this.pos.pixelX,
            y: this.pos.pixelY,
            grabbedBy: { x: this.grabbedBy.pos.tileX, y: this.grabbedBy.pos.tileY },
        };
    }
}
class Building {
    constructor(x, y, id, level) {
        this.id = id;
        this.level = level;
        this.item = null;
        this.pos = Pos.fromTileCoords(x, y, false);
    }
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY) != "base_water";
    }
    break() {
        if (this.item) {
            this.item.grabbedBy = null;
        }
        this.level.writeBuilding(this.pos.tileX, this.pos.tileY, null);
    }
    update(currentFrame) {
        this.item?.update(currentFrame);
    }
    display(currentFrame, ctx) {
        let pixelX = this.pos.tileX * consts.DISPLAY_TILE_SIZE + Game.scroll.x * consts.DISPLAY_SCALE;
        let pixelY = this.pos.tileY * consts.DISPLAY_TILE_SIZE + Game.scroll.y * consts.DISPLAY_SCALE;
        let _ctx = ctx ?? ctx2;
        let texture = registry.textures.building[this.id];
        if (texture) {
            if (+this.id % 0x100 == 5) {
                switch (this.id) {
                    case "0x0005":
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                        break;
                    case "0x0105":
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                        break;
                    case "0x0205":
                        _ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE);
                        break;
                    case "0x0305":
                        _ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2);
                        break;
                    case "0x0405":
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                        break;
                    case "0x0505":
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                        break;
                    case "0x0605":
                        _ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE * 2, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE);
                        break;
                    case "0x0705":
                        _ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3);
                        break;
                    case "0x0805":
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                        break;
                    case "0x0905":
                        _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
                        break;
                    case "0x0A05":
                        _ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE * 3, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE);
                        break;
                    case "0x0B05":
                        _ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4);
                        break;
                }
            }
            else if ((+this.id & 0x00F0) == 0x10) {
                _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE * 2);
            }
            else {
                _ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
                if (this.constructor.animated) {
                }
            }
        }
        else {
            _ctx.fillStyle = "#FF00FF";
            rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.fillStyle = "#000000";
            rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
            _ctx.font = "15px sans-serif";
            _ctx.fillStyle = "#00FF00";
            _ctx.fillText(this.id.toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
        }
    }
    hasItem() {
        if (this.item)
            return this.item;
        return null;
    }
    removeItem() {
        if (this.item) {
            let temp = this.item;
            this.item = null;
            return temp;
        }
        return null;
    }
    acceptsItemFromSide(side) {
        return true;
    }
    spawnItem(id) {
        id ?? (id = ItemID.base_null);
        if (this.level.buildingAtTile(this.pos.tileX + 1, this.pos.tileY) instanceof Conveyor &&
            this.level.buildingAtTile(this.pos.tileX + 1, this.pos.tileY).acceptsItemFromSide(Direction.left) &&
            this.level.buildingAtTile(this.pos.tileX + 1, this.pos.tileY).acceptItem(new Item((this.pos.tileX + 1.1) * consts.TILE_SIZE, (this.pos.tileY + 0.5) * consts.TILE_SIZE, id))) {
            return true;
        }
        else if (this.level.buildingAtTile(this.pos.tileX, this.pos.tileY + 1) instanceof Conveyor &&
            this.level.buildingAtTile(this.pos.tileX, this.pos.tileY + 1).acceptsItemFromSide(Direction.up) &&
            this.level.buildingAtTile(this.pos.tileX, this.pos.tileY + 1).acceptItem(new Item((this.pos.tileX + 0.5) * consts.TILE_SIZE, (this.pos.tileY + 1.1) * consts.TILE_SIZE, id))) {
            return true;
        }
        else if (this.level.buildingAtTile(this.pos.tileX - 1, this.pos.tileY) instanceof Conveyor &&
            this.level.buildingAtTile(this.pos.tileX - 1, this.pos.tileY).acceptsItemFromSide(Direction.right) &&
            this.level.buildingAtTile(this.pos.tileX - 1, this.pos.tileY).acceptItem(new Item((this.pos.tileX - 0.1) * consts.TILE_SIZE, (this.pos.tileY + 0.5) * consts.TILE_SIZE, id))) {
            return true;
        }
        else if (this.level.buildingAtTile(this.pos.tileX, this.pos.tileY - 1) instanceof Conveyor &&
            this.level.buildingAtTile(this.pos.tileX, this.pos.tileY - 1).acceptsItemFromSide(Direction.down) &&
            this.level.buildingAtTile(this.pos.tileX, this.pos.tileY - 1).acceptItem(new Item((this.pos.tileX + 0.5) * consts.TILE_SIZE, (this.pos.tileY - 0.1) * consts.TILE_SIZE, id))) {
            return true;
        }
        else {
            return false;
        }
    }
    acceptItem(item) {
        if (this.item === null) {
            this.item = item;
            item.grabbedBy = this;
            return true;
        }
        else {
            return false;
        }
    }
    export() {
        return {
            x: this.pos.tileX,
            y: this.pos.tileY,
            id: this.id,
            item: this.item?.export() ?? null,
            inv: []
        };
    }
}
Building.animated = false;
Building.outputsItems = false;
class BuildingWithRecipe extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.recipe = null;
        if (this.constructor === BuildingWithRecipe)
            throw new Error("Cannot initialize abstract class BuildingWithRecipe");
        this.timer = -1;
        this.items = [];
    }
    acceptItem(item) {
        for (let i = 0; i < consts.recipeMaxInputs; i++) {
            if (!this.items[i] && !this.items.map(item => item.id).includes(item.id)) {
                for (let recipe of this.constructor.recipeType.recipes) {
                    if (!recipe.inputs)
                        continue;
                    if (!this.items.map(item => recipe.inputs.includes(item.id)).includes(false) && recipe.inputs.includes(item.id)) {
                        this.items[i] = item;
                        item.grabbedBy = this;
                        if (recipe.inputs.length == i + 1) {
                            this.setRecipe(recipe);
                        }
                        return true;
                    }
                }
                return false;
            }
        }
        return false;
    }
    hasItem() {
        return null;
    }
    removeItem() {
        return null;
    }
    setRecipe(recipe) {
        if (!(recipe.inputs instanceof Array))
            throw new ShouldNotBePossibleError("tried to set invalid recipe");
        this.recipe = recipe;
        this.timer = recipe.duration;
    }
    update() {
        if (this.timer > 0) {
            this.timer--;
        }
        else if (this.timer == 0 && this.recipe) {
            if (this.spawnItem(this.recipe.outputs[0])) {
                this.timer = -1;
                this.items = [];
                this.recipe = null;
            }
        }
    }
}
BuildingWithRecipe.outputsItems = true;
class Miner extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.miningItem = null;
        this.timer = 61;
        for (let recipe of registry.recipes.base_mining.recipes) {
            if (recipe.tile == level.tileAtByTile(tileX, tileY)) {
                this.miningItem = recipe.outputs[0];
                return;
            }
        }
        console.warn(`Miner cannot mine tile at ${tileX}, ${tileY}`);
    }
    static canBuildAt(tileX, tileY, level) {
        return level.tileAtByTile(tileX, tileY).split("_")[1] == "ore";
    }
    update() {
        if (!this.miningItem)
            return;
        if (this.timer > 0) {
            this.timer--;
        }
        else {
            if (this.spawnItem(this.miningItem)) {
                this.timer = 61;
                trigger(triggerType.buildingRun, getRawBuildingID(this.id), this.miningItem);
            }
        }
    }
}
Miner.outputsItems = true;
class TrashCan extends Building {
    acceptItem(item) {
        return true;
    }
}
class Furnace extends BuildingWithRecipe {
}
Furnace.recipeType = registry.recipes.base_smelting;
Furnace.animated = true;
class Conveyor extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.item = null;
    }
    display(currentFrame) {
        super.display(currentFrame);
        if (this.item instanceof Item) {
            this.item.display(currentFrame);
        }
    }
    acceptsItemFromSide(side) {
        switch (side) {
            case Direction.left: return [
                0x00, 0x07, 0x0B, 0x0C, 0x0D, 0x0F, 0x13, 0x15, 0x17, 0x18, 0x19, 0x1B,
            ].includes(+this.id >> 8);
            case Direction.up: return [
                0x01, 0x05, 0x09, 0x0D, 0x0E, 0x0F, 0x11, 0x14, 0x16, 0x18, 0x19, 0x1A,
            ].includes(+this.id >> 8);
            case Direction.right: return [
                0x02, 0x06, 0x0A, 0x0E, 0x10, 0x11, 0x12, 0x15, 0x17, 0x19, 0x1A, 0x1B,
            ].includes(+this.id >> 8);
            case Direction.down: return [
                0x03, 0x08, 0x04, 0x0C, 0x10, 0x12, 0x13, 0x14, 0x16, 0x18, 0x1A, 0x1B,
            ].includes(+this.id >> 8);
        }
    }
    update() {
        if (this.item instanceof Item) {
            if (this.item.pos.tileX != this.pos.tileX || this.item.pos.tileY != this.pos.tileY) {
                let building = this.level.buildingAtPos(this.item.pos);
                if (!building)
                    return;
                if (building.acceptItem(this.item)) {
                    this.item = null;
                }
                return;
            }
            switch (+this.id >> 8) {
                case 0x00:
                    if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX += consts.buildings.conveyor.SPEED;
                    }
                    break;
                case 0x01:
                    if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelY += consts.buildings.conveyor.SPEED;
                    }
                    break;
                case 0x02:
                    if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX -= consts.buildings.conveyor.SPEED;
                    }
                    break;
                case 0x03:
                    if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelY -= consts.buildings.conveyor.SPEED;
                    }
                    break;
                case 0x04:
                    if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles > 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    break;
                case 0x05:
                    if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles < 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    break;
                case 0x06:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x07:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x08:
                    if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    break;
                case 0x09:
                    if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    break;
                case 0x0A:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x0B:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x0C:
                    if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    break;
                case 0x0D:
                    if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    break;
                case 0x0E:
                    if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x0F:
                    if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x10:
                    if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    break;
                case 0x11:
                    if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    break;
                case 0x12:
                    if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    else if (this.item.pos.tileOffsetXInTiles > 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x13:
                    if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    else if (this.item.pos.tileOffsetXInTiles < 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x14:
                    if (this.item.pos.tileOffsetXInTiles >= 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
                    }
                    break;
                case 0x15:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles >= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    else if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x16:
                    if (this.item.pos.tileOffsetXInTiles <= 0.5 && this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
                    }
                    break;
                case 0x17:
                    if (this.item.pos.tileOffsetXCentered && this.item.pos.tileOffsetYInTiles <= 0.5) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    else if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x18:
                    if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX++;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
                    }
                    break;
                case 0x19:
                    if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY++;
                    }
                    else if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
                case 0x1A:
                    if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX--;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    else if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY += this.item.pos.tileOffsetYInTiles > 0.5 ? -1 : 1;
                    }
                    break;
                case 0x1B:
                    if (this.item.pos.tileOffsetXCentered) {
                        this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
                        this.item.pos.pixelY--;
                    }
                    else if (this.item.pos.tileOffsetYCentered) {
                        this.item.pos.pixelX += this.item.pos.tileOffsetXInTiles > 0.5 ? -1 : 1;
                        this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
                    }
                    break;
            }
        }
    }
    acceptItem(item) {
        if (item.pos.tileX != this.pos.tileX || item.pos.tileY != this.pos.tileY)
            return false;
        if (item.pos.tileOffsetXInTiles <= 0.1 && this.acceptsItemFromSide(Direction.left) ||
            item.pos.tileOffsetYInTiles <= 0.1 && this.acceptsItemFromSide(Direction.up) ||
            item.pos.tileOffsetXInTiles >= 0.9 && this.acceptsItemFromSide(Direction.right) ||
            item.pos.tileOffsetYInTiles >= 0.9 && this.acceptsItemFromSide(Direction.down) ||
            item.pos.tileOffsetXCentered && item.pos.tileOffsetYCentered) {
            return super.acceptItem(item);
        }
        else
            return false;
    }
}
class Extractor extends Conveyor {
    constructor(x, y, id, level) {
        super(x, y, id, level);
    }
    display(currentFrame) {
        super.display(currentFrame);
        if (this.item instanceof Item) {
            this.item.display(currentFrame);
        }
    }
    grabItemFromTile(filter, callback, remove, grabDistance) {
        filter ?? (filter = (item) => { return item instanceof Item; });
        callback ?? (callback = () => { });
        if (this.level.buildingAtPos(this.pos) instanceof Building &&
            this.level.buildingAtPos(this.pos).hasItem() &&
            filter(this.level.buildingAtPos(this.pos).hasItem())) {
            let item = this.level.buildingAtPos(this.pos).removeItem();
            if (!(item instanceof Item))
                throw new ShouldNotBePossibleError("received invalid item");
            if (item.deleted)
                throw new ShouldNotBePossibleError("received deleted item");
            this.item = item;
            this.item.pos.pixelX = this.pos.pixelXCenteredInTile;
            this.item.pos.pixelY = this.pos.pixelYCenteredInTile;
            item.grabbedBy = this;
        }
    }
    dropItem() {
        if (this.item instanceof Item) {
            if (this.level.buildingAtPos(this.item.pos)?.acceptItem(this.item)) {
                this.item = null;
            }
        }
        else {
            console.error(this);
            throw new InvalidStateError(`no item to drop; extractor at ${this.pos.tileX} ${this.pos.tileY}`);
        }
    }
    update() {
        if (this.item instanceof Item) {
            if (this.item.grabbedBy != this || this.item.deleted) {
                console.error(this.item);
                console.error(this);
                throw new InvalidStateError("Item somehow grabbed or deleted from an extractor.");
            }
            switch (this.id) {
                case "0x0005":
                    if (this.item.pos.tileXExact >= this.pos.tileX + 1.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelX++;
                    }
                    break;
                case "0x0105":
                    if (this.item.pos.tileYExact >= this.pos.tileY + 1.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelY++;
                    }
                    break;
                case "0x0205":
                    if (this.item.pos.tileXExact <= this.pos.tileX - 0.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelX--;
                    }
                    break;
                case "0x0305":
                    if (this.item.pos.tileYExact <= this.pos.tileY - 0.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelY--;
                    }
                    break;
                case "0x0405":
                    if (this.item.pos.tileXExact >= this.pos.tileX + 2.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelX++;
                    }
                    break;
                case "0x0505":
                    if (this.item.pos.tileYExact >= this.pos.tileY + 2.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelY++;
                    }
                    break;
                case "0x0605":
                    if (this.item.pos.tileXExact <= this.pos.tileX - 1.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelX--;
                    }
                    break;
                case "0x0705":
                    if (this.item.pos.tileYExact <= this.pos.tileY - 1.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelY--;
                    }
                    break;
                case "0x0805":
                    if (this.item.pos.tileXExact >= this.pos.tileX + 3.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelX++;
                    }
                    break;
                case "0x0905":
                    if (this.item.pos.tileYExact >= this.pos.tileY + 3.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelY++;
                    }
                    break;
                case "0x0A05":
                    if (this.item.pos.tileXExact <= this.pos.tileX - 2.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelX--;
                    }
                    break;
                case "0x0B05":
                    if (this.item.pos.tileYExact <= this.pos.tileY - 2.5) {
                        return this.dropItem();
                    }
                    else {
                        this.item.pos.pixelY--;
                    }
                    break;
            }
        }
        else {
            this.grabItemFromTile();
        }
    }
    break() {
        if (this.item) {
            this.item.grabbedBy = null;
        }
        this.level.writeExtractor(this.pos.tileX, this.pos.tileY, null);
    }
}
class StorageBuilding extends Building {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        let temp = [];
        temp.MAX_LENGTH = 64;
        this.inventory = temp;
    }
    break() {
        if (this.inventory) {
            for (let item of this.inventory) {
                item.grabbedBy = null;
            }
        }
        super.break();
    }
    hasItem() {
        if (this.inventory && this.inventory?.length != 0)
            return this.inventory[0];
        return super.hasItem();
    }
    removeItem() {
        if (this.inventory?.length > 0) {
            return this.inventory.pop();
        }
        return super.removeItem();
    }
    acceptItem(item) {
        if (this.inventory?.length < this.inventory?.MAX_LENGTH) {
            this.inventory.push(item);
            return true;
        }
        else
            return super.acceptItem(item);
    }
    export() {
        let inv = [];
        if (this.inventory) {
            for (let item of this.inventory) {
                const data = item.export();
                if (data)
                    inv.push(data);
            }
        }
        return {
            x: this.pos.tileX,
            y: this.pos.tileY,
            id: this.id,
            item: this.item?.export() ?? null,
            inv: inv
        };
    }
}
class ResourceAcceptor extends Building {
    acceptItem(item) {
        item.deleted = true;
        item.grabbedBy = null;
        if (!this.level.resources[item.id]) {
            this.level.resources[item.id] = 0;
        }
        this.level.resources[item.id]++;
        return true;
    }
}
class AlloySmelter extends BuildingWithRecipe {
}
AlloySmelter.animated = true;
AlloySmelter.recipeType = registry.recipes.base_alloying;
class Wiremill extends BuildingWithRecipe {
}
Wiremill.recipeType = registry.recipes.base_wiremilling;
class Compressor extends BuildingWithRecipe {
}
Compressor.recipeType = registry.recipes.base_compressing;
class Lathe extends BuildingWithRecipe {
}
Lathe.recipeType = registry.recipes.base_lathing;
class MultiBlockController extends BuildingWithRecipe {
    constructor(tileX, tileY, id, level) {
        super(tileX, tileY, id, level);
        this.secondaries = [];
    }
    break() {
        this.secondaries.forEach(secondary => secondary.break(true));
        this.secondaries = [];
        super.break();
    }
    update() {
        if (this.secondaries.length != this.constructor.size[0] * this.constructor.size[1] - 1) {
            let possibleSecondaries = [
                this.level.buildingAtTile(this.pos.tileX + 1, this.pos.tileY),
                this.level.buildingAtTile(this.pos.tileX, this.pos.tileY + 1),
                this.level.buildingAtTile(this.pos.tileX + 1, this.pos.tileY + 1)
            ];
            for (let possibleSecondary of possibleSecondaries) {
                if (possibleSecondary instanceof MultiBlockSecondary && (possibleSecondary.controller == this || possibleSecondary.controller == undefined)) {
                    possibleSecondary.controller = this;
                    this.secondaries.push(possibleSecondary);
                }
                else {
                    return this.break();
                }
            }
            console.warn("Multiblock disconnected from secondaries. If you just loaded a save, this is fine.");
        }
        super.update();
    }
    spawnItem(id) {
        if (super.spawnItem(id)) {
            return true;
        }
        for (let secondary of this.secondaries) {
            if (secondary.spawnItem(id)) {
                return true;
            }
        }
        return false;
    }
}
MultiBlockController.size = [1, 1];
MultiBlockController.outputsItems = true;
class MultiBlockSecondary extends Building {
    constructor() {
        super(...arguments);
        this.controller = null;
    }
    acceptItem(item) {
        return this.controller?.acceptItem(item) ?? false;
    }
    break(isRecursive) {
        if (!isRecursive) {
            this.controller?.break();
        }
        else {
            this.controller = null;
            super.break();
        }
    }
    display(currentFrame) { }
    update() {
        if (!(this.controller instanceof MultiBlockController)) {
            this.break();
        }
    }
}
MultiBlockSecondary.outputsItems = true;
class Assembler extends MultiBlockController {
}
Assembler.recipeType = registry.recipes.base_assembling;
Assembler.size = [2, 2];
registry.buildings = {
    "0x01": Conveyor,
    "0x02": Miner,
    "0x03": TrashCan,
    "0x04": Furnace,
    "0x05": Extractor,
    "0x06": StorageBuilding,
    "0x07": AlloySmelter,
    "0x08": ResourceAcceptor,
    "0x09": Wiremill,
    "0x0A": Compressor,
    "0x0B": Lathe,
    "0x10": MultiBlockSecondary,
    "0x11": Assembler,
    "0xFF": null
};
