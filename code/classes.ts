/*
	Main classes.
*/



class Level {
	resources: {
		[index: string]: number
	}
	storage: Map<string, Chunk>;
	seed: number;
	format: string;
	uuid: string;
	constructor(data:number|LevelData){
		this.storage = new Map<string, Chunk>();
		this.format = consts.VERSION;
		this.resources = {};
		if(typeof data != "object"){
			this.seed = data ?? 0;
			this.uuid = Math.random().toString().substring(2);
			this.generateNecessaryChunks();
			this.buildBuilding(0, 0, BuildingID["0x0008"]);
			this.buildBuilding(0, -1, BuildingID["0x0008"]);
			this.buildBuilding(-1, 0, BuildingID["0x0008"]);
			this.buildBuilding(-1, -1, BuildingID["0x0008"]);
		} else {
			// Generate a level from JSON
			let {chunks, resources, seed, version, uuid} = data;
			this.seed = seed;
			this.resources = resources;
			this.uuid = uuid;
			let position, chunkData;
			try {
				for([position, chunkData] of Object.entries(chunks)){
					chunkData.version = version;
					this.storage.set(position, new Chunk({
						x: parseInt(position.split(",")[0]), y: parseInt(position.split(",")[1]),
						seed: seed, parent: this
					}, chunkData).generate());
					//Generate a chunk with that data
				}
			} catch(err){
				throw new Error(`Error loading chunk ${position}: ${parseError(err)}`)
			}

		}
	}
	hasChunk(tileX:number, tileY:number):boolean {
		return !! this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`);
	}
	getChunk(tileX:number, tileY:number):Chunk {
		if(!this.hasChunk(tileX, tileY)){
			this.generateChunk(Math.floor(tileX / consts.CHUNK_SIZE), Math.floor(tileY / consts.CHUNK_SIZE));
		}
		return this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`)!;
	}
	generateChunk(x:number, y:number){
		if(this.storage.get(`${x},${y}`)){
			return;
		}
		this.storage.set(`${x},${y}`, 
			new Chunk({x: x, y: y, seed: this.seed, parent: this})
			.generate()
		);
	}
	generateNecessaryChunks(){
		let xOffset = - Math.floor((Game.scroll.x * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
		let yOffset = - Math.floor((Game.scroll.y * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
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
		//good enough
	}

	tileAtByPixel(pixelX:number, pixelY:number):TileID{
		return this.getChunk(
			Math.floor(pixelX/consts.TILE_SIZE),
			Math.floor(pixelY/consts.TILE_SIZE)
		).tileAt(tileOffsetInChunk(pixelX/consts.TILE_SIZE), tileOffsetInChunk(pixelY/consts.TILE_SIZE));
	}
	tileAtByTile(tileX:number, tileY:number):TileID{
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).tileAt(tileOffsetInChunk(tileX), tileOffsetInChunk(tileY));
	}
	setTileByTile(tileX:number, tileY:number, tile:TileID):boolean {
		this.getChunk(tileX,tileY).setTile(tileOffsetInChunk(tileX), tileOffsetInChunk(tileY), tile);
		Game.forceRedraw = true;
		return true;
	}
	buildingIDAtPixel(pixelX:number, pixelY:number):BuildingID {
		return this.getChunk(
			Math.floor(pixelX/consts.TILE_SIZE),
			Math.floor(pixelY/consts.TILE_SIZE)
		).buildingAt(tileOffsetInChunk(pixelX/consts.TILE_SIZE), tileOffsetInChunk(pixelY/consts.TILE_SIZE))?.id ?? BuildingID["0xFFFF"];
	}
	buildingIDAtTile(tileX:number, tileY:number):BuildingID {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).buildingAt(tileOffsetInChunk(tileX), tileOffsetInChunk(tileY))?.id ?? BuildingID["0xFFFF"];
	}
	buildingAtTile(tileX:number, tileY:number):Building | null {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).buildingAt(tileOffsetInChunk(tileX), tileOffsetInChunk(tileY));
	}
	buildingAtPixel(pixelX:number, pixelY:number):Building | null {
		return this.getChunk(
			Math.floor(pixelX/consts.TILE_SIZE),
			Math.floor(pixelY/consts.TILE_SIZE)
		).buildingAt(tileOffsetInChunk(pixelX/consts.TILE_SIZE), tileOffsetInChunk(pixelY/consts.TILE_SIZE));
	}
	extractorAtTile(tileX:number, tileY:number):Extractor | null {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).extractorAt(tileOffsetInChunk(tileX), tileOffsetInChunk(tileY));
	}
	writeBuilding(tileX:number, tileY:number, building:Building | null):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setBuilding(tileOffsetInChunk(tileX), tileOffsetInChunk(tileY), building);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	writeExtractor(tileX:number, tileY:number, building:Extractor | null):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setExtractor(tileOffsetInChunk(tileX), tileOffsetInChunk(tileY), building);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	
	
	displayGhostBuilding(tileX:number, tileY:number, buildingID:BuildingID){
		tileX = Math.floor(tileX);
		tileY = Math.floor(tileY);
		//Tells a chunk to display a ghost building.
		if(!this.hasChunk(tileX, tileY)){
			return;
		}
		switch(getRawBuildingID(buildingID)){
			case "0x01":
				let meta = +buildingID >> 8;
				this.getChunk(tileX, tileY).displayGhostBuilding(
					tileOffsetInChunk(tileX), tileOffsetInChunk(tileY),
					[0, 1, 2, 3].includes(meta) ? this.getTurnedConveyor(tileX, tileY, meta as 0 | 1 | 2 | 3) : buildingID,
					!Conveyor.canBuildAt(tileX, tileY, this)
				);
				break;
			default:
				this.getChunk(tileX, tileY).displayGhostBuilding(
					tileOffsetInChunk(tileX), tileOffsetInChunk(tileY), buildingID,
					!registry.buildings[getRawBuildingID(buildingID)]?.canBuildAt(tileX, tileY, this)
				);
				break;
		}
	}
	getTurnedConveyor(tileX:number, tileY:number, conveyorType:0 | 1 | 2 | 3):BuildingID {
		//Returns how a conveyor should be turned based on nearby buildings.
		if(registry.keybinds.placement.force_straight_conveyor.isHeld()){
			return hex((conveyorType * 0x100) + 1, 4) as BuildingID;
			//If holding shift, just return a straight conveyor.
		}
		tileX = Math.floor(tileX);
		tileY = Math.floor(tileY);
		//🍝👨‍💻 is delicious
		function isOutputBuilding(buildingid:BuildingID):boolean {
			return ["0x0002", "0x0004", "0x0007", "0x0009", "0x000A", "0x000B", "0x0011"].includes(buildingid);
		}
		let leftBuilding:BuildingID = this.buildingIDAtTile(tileX - 1, tileY);
		let hasLeftBuilding = ["0x0001", "0x0401", "0x0501", "0x0C01", "0x0D01"].includes(leftBuilding)
			|| isOutputBuilding(leftBuilding);
		let topBuilding:BuildingID = this.buildingIDAtTile(tileX, tileY - 1);
		let hasTopBuilding = ["0x0101", "0x0601", "0x0701", "0x0E01", "0x0F01"].includes(topBuilding)
			|| isOutputBuilding(topBuilding);
		let rightBuilding:BuildingID = this.buildingIDAtTile(tileX + 1, tileY);
		let hasRightBuilding = ["0x0201", "0x0801", "0x0901", "0x1001", "0x1101"].includes(rightBuilding)
			|| isOutputBuilding(rightBuilding);
		let bottomBuilding:BuildingID = this.buildingIDAtTile(tileX, tileY + 1);
		let hasBottomBuilding = ["0x0301", "0x0A01", "0x0B01", "0x1201", "0x1301"].includes(bottomBuilding)
			|| isOutputBuilding(bottomBuilding);
		
		switch(conveyorType){
			case 0:
				if(hasLeftBuilding){
					if(hasTopBuilding && hasBottomBuilding){
						return BuildingID["0x1801"];
					} else if(hasTopBuilding){
						return BuildingID["0x0D01"];
					} else if(hasBottomBuilding){
						return BuildingID["0x0C01"];
					} else {
						return BuildingID["0x0001"];
					}
				} else {
					if(hasTopBuilding && hasBottomBuilding){
						return BuildingID["0x1401"];
					} else if(hasTopBuilding){
						return BuildingID["0x0501"];
					} else if(hasBottomBuilding){
						return BuildingID["0x0401"];
					} else {
						return BuildingID["0x0001"];
					}
				}
				break;
			case 1:
				if(hasTopBuilding){
					if(hasLeftBuilding && hasRightBuilding){
						return BuildingID["0x1901"];
					} else if(hasLeftBuilding){
						return BuildingID["0x0F01"];
					} else if(hasRightBuilding){
						return BuildingID["0x0E01"];
					} else {
						return BuildingID["0x0101"];
					}
				} else {
					if(hasLeftBuilding && hasRightBuilding){
						return BuildingID["0x1501"];
					} else if(hasLeftBuilding){
						return BuildingID["0x0701"];
					} else if(hasRightBuilding){
						return BuildingID["0x0601"];
					} else {
						return BuildingID["0x0101"];
					}
				}
				break;
			case 2:
				if(hasRightBuilding){
					if(hasTopBuilding && hasBottomBuilding){
						return BuildingID["0x1A01"];
					} else if(hasTopBuilding){
						return BuildingID["0x1101"];
					} else if(hasBottomBuilding){
						return BuildingID["0x1001"];
					} else {
						return BuildingID["0x0201"];
					}
				} else {
					if(hasTopBuilding && hasBottomBuilding){
						return BuildingID["0x1601"];
					} else if(hasTopBuilding){
						return BuildingID["0x0901"];
					} else if(hasBottomBuilding){
						return BuildingID["0x0801"];
					} else {
						return BuildingID["0x0201"];
					}
				}
				break;
			case 3:
				if(hasBottomBuilding){
					if(hasLeftBuilding && hasRightBuilding){
						return BuildingID["0x1B01"];
					} else if(hasLeftBuilding){
						return BuildingID["0x1301"];
					} else if(hasRightBuilding){
						return BuildingID["0x1201"];
					} else {
						return BuildingID["0x0301"];
					}
				} else {
					if(hasLeftBuilding && hasRightBuilding){
						return BuildingID["0x1701"];
					} else if(hasLeftBuilding){
						return BuildingID["0x0B01"];
					} else if(hasRightBuilding){
						return BuildingID["0x0A01"];
					} else {
						return BuildingID["0x0301"];
					}
				}
				break;
		}
	}
	buildBuilding(tileX:number, tileY:number, buildingID:BuildingID):boolean {
		if(this.buildingIDAtTile(tileX, tileY) == "0x0008") return false;

		//Only overwrite the same building once per build attempt.
		//Otherwise, you could constantly overwrite a building on every frame you tried to build, which is not good.
		if(getRawBuildingID(buildingID) == "0x05"){
			if(this.extractorAtTile(tileX, tileY)?.id == buildingID){
				if(!canOverwriteBuilding) return false;
				canOverwriteBuilding = false;
			}
			this.extractorAtTile(tileX, tileY)?.break();
		} else {
			if(this.buildingAtTile(tileX, tileY)?.id == buildingID){
				if(!canOverwriteBuilding) return false;
				canOverwriteBuilding = false;
			}
			this.buildingAtTile(tileX, tileY)?.break();
		}

		let tempBuilding:Building;
		
		if(buildingID == "0xFFFF"){
			return true;
		}
		if(((+buildingID) & 0x00F0) == 0x10){
			//Multiblock handling

			//Break all the buildings under
			this.buildingAtTile(tileX + 1, tileY)?.break();
			this.buildingAtTile(tileX, tileY + 1)?.break();
			this.buildingAtTile(tileX+1, tileY+1)?.break();

			switch(getRawBuildingID(buildingID)){
				case "0x11":
					let controller = new registry.buildings[getRawBuildingID(buildingID)](tileX, tileY, buildingID, this) as MultiBlockController;
					let secondary1 = new MultiBlockSecondary(tileX + 1, tileY, BuildingID["0x0010"], this);
					let secondary2 = new MultiBlockSecondary(tileX, tileY + 1, BuildingID["0x0010"], this);
					let secondary3 = new MultiBlockSecondary(tileX+1, tileY+1, BuildingID["0x0010"], this);
					controller.secondaries = [secondary1, secondary2, secondary3];
					[secondary1, secondary2, secondary3].forEach(secondary => secondary.controller = controller);
					this.writeBuilding(tileX, tileY, controller);
					this.writeBuilding(tileX + 1, tileY, secondary1);
					this.writeBuilding(tileX, tileY + 1, secondary2);
					this.writeBuilding(tileX+1, tileY+1, secondary3);
				break;
				default:
					return false;
			}
			return true;
		}
		if(registry.buildings[getRawBuildingID(buildingID)]?.canBuildAt(tileX, tileY, this)){
			trigger(triggerType.placeBuilding, getRawBuildingID(buildingID));
			tempBuilding = new registry.buildings[getRawBuildingID(buildingID)](
				tileX, tileY,
				getRawBuildingID(buildingID) == "0x01" ?
				this.getTurnedConveyor(tileX, tileY, +buildingID >> 8 as 0 | 1 | 2 | 3) : buildingID, this
			);
		} else {
			trigger(triggerType.placeBuildingFail, getRawBuildingID(buildingID));
			return false;
		}
		if(tempBuilding instanceof Extractor){
			return this.writeExtractor(tileX, tileY, tempBuilding);
		} else {
			return this.writeBuilding(tileX, tileY, tempBuilding);
		}
	}

	update(currentFrame:CurrentFrame){
		for(let chunk of this.storage.values()){
			chunk.update(currentFrame);
		}
	}
	display(currentframe:Object):void {
		
		//Instantly returns in the display method if offscreen.
		for(let chunk of this.storage.values()){
			chunk.display(currentframe);
		}
		
	}
	displayTooltip(mousex:number, mousey:number, currentframe:CurrentFrame){
		if(!currentframe.tooltip){return;}
		let x = (mousex - (Game.scroll.x * consts.DISPLAY_SCALE))/consts.DISPLAY_SCALE;
		let y = (mousey - (Game.scroll.y * consts.DISPLAY_SCALE))/consts.DISPLAY_SCALE;
		ctx4.font = "16px monospace";
		if(this.buildingAtPixel(x, y) instanceof Building){
			let buildingID = getRawBuildingID(this.buildingIDAtPixel(x, y));
			if(getRawBuildingID(this.buildingIDAtPixel(x, y)) == "0x01" && this.buildingAtPixel(x, y)!.item){
				let item = this.buildingAtPixel(x, y)!.item;
				if(item && (Math.abs(item.x - x) < 8) && Math.abs(item.y - y) < 8){
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
	export():LevelData {
		//Exports the level's data to JSON.
		let chunkOutput:Record<string, ChunkData> = {};
		for(let [position, chunk] of this.storage.entries()){
			let output = chunk.export();
			if(output){
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
	layers: [
		TileID[][],
		(Building | null)[][],
		(Extractor | null)[][]
	];
	generator: Generator;
	x: number;
	y: number;
	chunkSeed: number;
	parent: Level;
	hasBuildings: boolean = false;
	constructor({x, y, seed, parent}: { x: number; y: number; seed: number; parent: Level;}, data?:ChunkData){
		this.x = x;
		this.y = y;
		this.parent = parent;
		let tweakedX = x == 0 ? 5850 : x;
		let tweakedY = y == 0 ? 9223 : y;
		this.chunkSeed = Math.abs(
			(((tweakedX) ** 3) * (tweakedY ** 5) + 3850 + ((seed - 314) * 11)) % (2 ** 16)
		);
		this.generator = pseudoRandom(this.chunkSeed);
		this.layers = [
			[],
			[],
			[]
		];

		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[0][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[0][x].push("0xFF");
			}
		}

		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[1][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[1][x].push(null);
			}
		}

		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[2][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[2][x].push(null);
			}
		}

		if(data){
			//Import a chunk from JSON data.
			//TODO 🚮
			if(+data.version.split(" ")[1].replaceAll(".", "") < 200){
				(data as any).layers = data;
			}
			for(let y in data.layers[0]){
				for(let x in data.layers[0][y]){
					let buildingData = data.layers[0][y][x];
					if(!buildingData) continue;
					this.hasBuildings = true;
					if(+data.version.split(" ")[1].replaceAll(".", "") <= 200){
						buildingData.id = hex(buildingData.id as any as number, 4) as BuildingID;
						//aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa I am looking forward to beta when I can throw out these garbage formats
					}
					let tempBuilding:Building;
					try {
						tempBuilding = new registry.buildings[getRawBuildingID(buildingData.id)](
							parseInt(x) + (consts.CHUNK_SIZE * this.x),
							parseInt(y) + (consts.CHUNK_SIZE * this.y),
							buildingData.id, this.parent
						);
					} catch(err){
						console.error(err);
						throw new Error(`Failed to import building id ${buildingData.id} at position ${x},${y} in chunk ${this.x},${this.y}. See console for more details.`);
					}
					if(buildingData.item){
						//If the building has an item, spawn it in.
						tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id, this.parent);
						tempBuilding.item.grabbedBy = tempBuilding;
					}
					if(buildingData.inv && tempBuilding instanceof StorageBuilding){
						//If the building has an inventory, spawn in the items.
						for(let itemData of buildingData.inv){
							let tempItem = new Item(itemData.x, itemData.y, itemData.id, this.parent);
							tempItem.grabbedBy = tempBuilding;
							tempBuilding.inventory.push(tempItem);
						}
					}
					this.layers[1][y][x] = tempBuilding;
				}
			}

			for(let y in data.layers[1]){
				for(let x in data.layers[1][y]){
					let buildingData = data.layers[1][y][x];
					if(!buildingData) continue;
					this.hasBuildings = true;
					if(+data.version.split(" ")[1].replaceAll(".", "") <= 200){
						buildingData.id = hex(buildingData.id as any as number, 4) as BuildingID;
					}
					let tempBuilding = new Extractor(
						parseInt(x) + (consts.CHUNK_SIZE * this.x),
						parseInt(y) + (consts.CHUNK_SIZE * this.y),
						buildingData.id, this.parent
					);
					if(buildingData.item && +data.version.split(" ")[1].replaceAll(".", "") >= 130){
						//AAAAAAAAAAAAAAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaAAA
						tempBuilding.item = new Item(buildingData.item.x, buildingData.item.y, buildingData.item.id, this.parent);
						tempBuilding.item.grabbedBy = tempBuilding;
					}
					//Same as above but for extractors.
					this.layers[2][y][x] = tempBuilding;
				}
			}
		}

		return this;
	}
	update(currentFrame:CurrentFrame):Chunk {
		if(!this.hasBuildings) return this;
		for(let row of this.layers[1]){
			for(let value of row){
				value?.update?.(currentFrame);
			}
		}
		for(let row of this.layers[2]){
			for(let value of row){
				value?.update?.();
			}
		}
		return this;
	}
	tileAt(tileX:number, tileY:number):TileID {
		return this.layers[0][tileY]?.[tileX] ?? (() => {throw new Error(`Tile ${tileX}, ${tileY} does not exist!`)})();
	}
	buildingAt(tileX:number, tileY:number):Building | null {
		return this.layers[1][tileY]?.[tileX] ?? null;
	}
	extractorAt(tileX:number, tileY:number):Extractor | null {
		return this.layers[2][tileY]?.[tileX] ?? null;
	}
	setTile(tileX:number, tileY:number, value:TileID):boolean {
		try {
			this.tileAt(tileX, tileY);
		} catch(err){
			return false;
		}
		this.layers[0][tileY][tileX] = value;
		return true;
	}
	setBuilding(tileX:number, tileY:number, value:Building | null):boolean {
		if(this.tileAt(tileX, tileY) == null){
			return false;
		}
		this.layers[1][tileY][tileX] = value;
		if(value instanceof Building) this.hasBuildings = true;
		return true;
	}
	setExtractor(tileX:number, tileY:number, value:Extractor | null):boolean {
		if(this.tileAt(tileX, tileY) == null){
			return false;
		}
		this.layers[2][tileY][tileX] = value;
		if(value instanceof Building) this.hasBuildings = true;
		return true;
	}
	/**
	 * @deprecated
	 */
	displayToConsole(){
		console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
		console.table(this.layers[0]);
		//The oldest method in this program. Was used a very long time ago.
	}
	generate():Chunk {
		//This... needs to be refactored.  TODO
		let isWet = false;
		let isHilly = false;

		let distanceFromSpawn = Math.sqrt(this.x **2 + this.y **2);
		let distanceBoost = constrain(Math.log((distanceFromSpawn / generation_consts.ore_scale) + 0.5)/2, 0, 0.6);
		//A value added to the perlin noise on each tile to make the amount of stone/ore increase, scales as you go further out.

		if(this.generator.next().value < 0.07 && distanceFromSpawn > generation_consts.min_water_chunk_distance){
			isWet = true;
		} else if(distanceBoost > generation_consts.hilly.terrain_cutoff){
			isHilly = true;
		}
		
		if(isWet){//Generator for wet chunks.
			for(let row in this.layers[0]){
				for(let tile in this.layers[0][row]){
					//Choose the tile to be placed:
					if(row == "0" || row == "15" || tile == "0" || tile == "15"){
						this.layers[0][row][tile] = "0x02";//If on edge, place water
					} else if(row == "1" || row == "14" || tile == "1" || tile == "14"){
						this.layers[0][row][tile] = this.generator.next().value > 0.5 ? "0x01" : "0x02";//If near edge, place 50-50 stone or water		
					} else {
						this.layers[0][row][tile] = 
						this.generator.next().value < 0.1 ?
						(this.generator.next().value < 0.3 ? "0x11" : "0x10")
						: "0x01";
						//Otherwise, stone, iron, or coal.
					}
				}
			}
		} else if(isHilly){
			//Hilly terrain generator:
			//Based on perlin noise.

			//Chooses which ore to generate based on RNG and ditance from spawn.
			let oreToGenerate:TileID = "0xFF";
			let oreRand = this.generator.next().value;
			if(distanceFromSpawn < generation_consts.hilly.min_iron_distance){
				oreToGenerate = "0x10";
			} else if(distanceFromSpawn < generation_consts.hilly.min_copper_distance){
				oreToGenerate = oreRand > 0.5 ? "0x10" : "0x11";
			} else {
				oreToGenerate = oreRand > 0.5 ? "0x10" : (oreRand > 0.25 ? "0x11" : "0x12");
			}


			for(let row in this.layers[0]){
				for(let tile in this.layers[0][row]){
					//Choose the tile to be placed:
					let noiseHeight = 
					Math.abs(noise.perlin2(
						((this.x * consts.CHUNK_SIZE) + +tile + this.parent.seed) / generation_consts.perlin_scale,
						((this.y * consts.CHUNK_SIZE) + +row + (this.parent.seed + generation_consts.y_offset))
							/ generation_consts.perlin_scale
					));
					//This formula just finds the perlin noise value at a tile, but tweaked so it's different per seed and not mirrored diagonally.

					if((noiseHeight + distanceBoost / 2) > generation_consts.hilly.ore_threshold){
						this.layers[0][row][tile] = oreToGenerate;
					} else if((noiseHeight + distanceBoost) > generation_consts.hilly.stone_threshold){
						this.layers[0][row][tile] = "0x01";
					} else {
						this.layers[0][row][tile] = "0x00";
					}
				}
			}
		} else {
			//Old terrain generation. I kept it, just only close to spawn.
			for(let row in this.layers[0]){
				for(let tile in this.layers[0][row]){
					this.layers[0][row][tile] = "0x00";
				}
			}
			let oreToGenerate:TileID = "0xFF";
			if(distanceFromSpawn < 3){
				oreToGenerate = "0x10";
			} else {
				oreToGenerate = (this.generator.next().value > 0.5) ? "0x11" : "0x10";
			}
			let hill_x = Math.floor(this.generator.next().value * 16);
			let hill_y = Math.floor(this.generator.next().value * 16);

			//Makes a "hill", with an ore node in the middle, stone on the sides, and maybe stone in the corners.
			this.setTile(hill_x, hill_y, oreToGenerate);
			this.setTile(hill_x + 1, hill_y, "0x01");
			this.setTile(hill_x - 1, hill_y, "0x01");
			this.setTile(hill_x, hill_y + 1, "0x01");
			this.setTile(hill_x, hill_y - 1, "0x01");
			this.setTile(hill_x + 1, hill_y + 1, (this.generator.next().value > 0.5) ? "0x01" : "0x00");
			this.setTile(hill_x + 1, hill_y - 1, (this.generator.next().value > 0.5) ? "0x01" : "0x00");
			this.setTile(hill_x - 1, hill_y + 1, (this.generator.next().value > 0.5) ? "0x01" : "0x00");
			this.setTile(hill_x - 1, hill_y - 1, (this.generator.next().value > 0.5) ? "0x01" : "0x00");
		}


		return this;
	}
	display(currentframe:any){
		if(
			(Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerWidth + 1 ||
			(Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE ||
			(Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerHeight + 1 ||
			(Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE
		) return;//if offscreen return immediately
		currentframe.cps ++;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 1;
		
		if(currentframe.redraw){
			for(let y = 0; y < this.layers[0].length; y ++){
				for(let x = 0; x < this.layers[0][y].length; x ++){
					this.displayTile(x, y, currentframe);
				}
			}
		}
		for(let y = 0; y < this.layers[1].length; y ++){
			for(let x = 0; x < this.layers[1][y].length; x ++){
				if(this.layers[1][y][x] instanceof Building){
					this.layers[1][y][x]!.display(currentframe);
				}
			}
		}
		for(let y = 0; y < this.layers[2].length; y ++){
			for(let x = 0; x < this.layers[2][y].length; x ++){
				if(this.layers[2][y][x]){
					this.displayL3(x, y, this.layers[2][y][x]?.id ?? BuildingID["0xFFFF"]);
					this.layers[2][y][x]!.display(currentframe);
				}
			}
		}
		if(currentframe.debug){
			ctx4.strokeStyle = "#0000FF";
			ctx4.strokeRect(
				this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE),
				this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE),
				consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE
			);
		}
	}
	displayTile(x:number, y:number, currentframe:CurrentFrame){
		currentframe.tps ++;
		let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
		let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
		if(settings.graphics_mode || (this.tileAt(x,y) != "0x00")){
			if(registry.textures.tile[this.tileAt(x,y)]){
				ctx.drawImage(registry.textures.tile[this.tileAt(x,y)], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
			} else {
				ctx.fillStyle = "#FF00FF";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				ctx.fillStyle = "#000000";
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				ctx.font = "15px sans-serif";
				ctx.fillStyle = "#00FF00";
				ctx.fillText(this.tileAt(x, y).toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
			}
		} else {
			ctx.fillStyle = "#00CC33";
			rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
		}
		if(currentframe.debug) ctx.strokeRect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
	}
	displayGhostBuilding(x:number, y:number, buildingID:BuildingID, isError:boolean){
		let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
		let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
		let _ctx = ctx1;
		if(registry.keybinds.placement.break_building.isHeld()){
			_ctx.globalAlpha = 0.9;
			_ctx.drawImage(registry.textures.misc["invalidunderlay"], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
			_ctx.globalAlpha = 1.0;
			return;
		}
		if(buildingID == "0xFFFF") return;

		if(isError){
			_ctx.globalAlpha = 0.9;
			_ctx.drawImage(registry.textures.misc["invalidunderlay"], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
			_ctx.globalAlpha = +buildingID % 0x100 == 0x01 ? 0.3 : 0.7;
		} else {
			_ctx.globalAlpha = 0.9;
			if((+buildingID & 0x00F0) == 0x10){
				_ctx.drawImage(registry.textures.misc["ghostunderlay"], pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE * 2);
			} else {
				_ctx.drawImage(registry.textures.misc["ghostunderlay"], pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
			}
			_ctx.globalAlpha = +buildingID % 0x100 == 0x01 ? 0.3 : 0.7;
		}
		
		Building.prototype.display.bind({
			x: (this.x * consts.CHUNK_SIZE) + x,
			y: (this.y * consts.CHUNK_SIZE) + y,
			id: buildingID,
			level: this
		})({} as CurrentFrame, ctx1);
		//TODO! grab currentframe
		_ctx.globalAlpha = 1.0;
	}
	displayL3(x:number, y:number, buildingID:BuildingID, isGhost?:number){
		if(buildingID == "0xFFFF"){return;}
		let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
		let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
		let _ctx = ctx25;
		if(registry.textures.building[buildingID]){
			switch(buildingID){
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
		} else {
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
	export():ChunkData | null {
		let exportDataL1:(BuildingData | null)[][] = [];
		let hasBuildings = false;
		for(let row of this.layers[1]){
			let tempRow:(BuildingData | null)[] = [];
			for(let building of row){
				if(building instanceof Building){
					hasBuildings = true;
				}
				tempRow.push(building?.export() ?? null);
			}
			exportDataL1.push(tempRow);
		}

		let exportDataL2:(BuildingData | null)[][]= [];
		for(let row of this.layers[2]){
			let tempRow:(BuildingData | null)[] = [];
			for(let extractor of row){
				if(extractor instanceof Extractor){
					hasBuildings = true;
				}
				tempRow.push(extractor?.export() ?? null);
			}
			exportDataL2.push(tempRow);
		}

		if(hasBuildings){
			return {
				layers: [exportDataL1, exportDataL2],
				version: consts.VERSION,
			};
		} else {
			return null;
		}
	}
}

class Item {
	id: ItemID;
	x: number;
	y: number;
	level: Level;
	grabbedBy: Building | null;
	deleted: boolean;
	constructor(x:number, y:number, id:ItemID, level:Level){
		this.id = id;
		this.x = x;
		this.y = y;
		this.level = level;
		this.grabbedBy = null;
		this.deleted = false;
	}
	update(currentframe:CurrentFrame){
		//nothing necessary
	}
	display(currentframe:CurrentFrame){
		if(
			consts.DISPLAY_SCALE * (this.x + Game.scroll.x - 8) < 0 ||
			consts.DISPLAY_SCALE * (this.x + Game.scroll.x - 8) > window.innerWidth ||
			consts.DISPLAY_SCALE * (this.y + Game.scroll.y - 8) < 0 ||
			consts.DISPLAY_SCALE * (this.y + Game.scroll.y - 8) > window.innerHeight
		){return;}//if offscreen return immediately
		currentframe.ips ++;
		ctx3.drawImage(
			registry.textures.item[this.id],
			this.x * consts.DISPLAY_SCALE + (Game.scroll.x * consts.DISPLAY_SCALE) - 8*consts.DISPLAY_SCALE,
			this.y * consts.DISPLAY_SCALE + (Game.scroll.y * consts.DISPLAY_SCALE) - 8*consts.DISPLAY_SCALE,
			16 * consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE
		);
	}
	export():ItemData | null {
		if(this.deleted || !this.grabbedBy) return null;
		return {
			id: this.id,
			x: this.x,
			y: this.y,
			grabbedBy: {x: this.grabbedBy.x, y: this.grabbedBy.y},
		};
	}
}

class Building {
	x: number;
	y: number;
	id: BuildingID;
	item: Item | null = null;
	level: Level;
	static animated = false;
	constructor(tileX:number, tileY: number, id:BuildingID, level:Level){
		this.x = tileX;
		this.y = tileY;
		this.id = id;
		this.level = level;
	}
	static canBuildAt(tileX:number, tileY:number, level:Level){
		return level.tileAtByTile(tileX, tileY) != "0x02";
	}
	break(){
		if(this.item){
			this.item.grabbedBy = null;
		}
		this.level.writeBuilding(this.x, this.y, null);
	}
	update(currentFrame:CurrentFrame){
		this.item?.update(currentFrame);
	}
	display(currentFrame:CurrentFrame, ctx?: CanvasRenderingContext2D){
		let pixelX = this.x * consts.DISPLAY_TILE_SIZE + Game.scroll.x * consts.DISPLAY_SCALE;
		let pixelY = this.y * consts.DISPLAY_TILE_SIZE + Game.scroll.y * consts.DISPLAY_SCALE;
		let _ctx = ctx ?? ctx2;
		let texture = registry.textures.building[this.id];
		if(texture){
			if(+this.id % 0x100 == 5){
				switch(this.id){
					case "0x0005":
						_ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE); break;
					case "0x0105":
						_ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2); break;
					case "0x0205":
						_ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE); break;
					case "0x0305":
						_ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 2); break;
					case "0x0405":
						_ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE); break;
					case "0x0505":
						_ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3); break;
					case "0x0605":
						_ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE * 2, pixelY, consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE); break;
					case "0x0705":
						_ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 3); break;
					case "0x0805":
						_ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE); break;
					case "0x0905":
						_ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4); break;
					case "0x0A05":
						_ctx.drawImage(texture, pixelX - consts.DISPLAY_TILE_SIZE * 3, pixelY, consts.DISPLAY_TILE_SIZE * 4, consts.DISPLAY_TILE_SIZE); break;
					case "0x0B05":
						_ctx.drawImage(texture, pixelX, pixelY - consts.DISPLAY_TILE_SIZE * 3, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE * 4); break;
				}
			} else if((+this.id & 0x00F0) == 0x10){
				//Multiblock
				_ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE * 2, consts.DISPLAY_TILE_SIZE * 2);
			} else {
				_ctx.drawImage(texture, pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				if((this.constructor as typeof Building).animated){
					//do animations
				}
			}
		} else {
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
	hasItem():Item | null {
		if(this.item) return this.item;
		return null;
	}
	removeItem():Item | null {
		if(this.item){
			let temp = this.item;
			this.item = null;
			return temp;
		}
		return null;
	}
	spawnItem(id:ItemID){
		id ??= ItemID.base_null;
		if(
			["0x0001", "0x0701", "0x0B01", "0x0C01", "0x0D01", "0x0F01", "0x1301", "0x1501", "0x1701", "0x1801", "0x1901", "0x1B01"]
			.includes(this.level.buildingIDAtTile(this.x + 1, this.y)) &&
			this.level.buildingAtTile(this.x + 1, this.y)!.acceptItem(
				new Item((this.x + 1.1) * consts.TILE_SIZE, (this.y + 0.5) * consts.TILE_SIZE, id, this.level)
			)
		){
			return true;
		} else if(
			["0x0101", "0x0501", "0x0901", "0x0D01", "0x0E01", "0x0F01", "0x1101", "0x1401", "0x1601", "0x1801", "0x1901", "0x1A01"]
			.includes(this.level.buildingIDAtTile(this.x, this.y + 1)) &&
			this.level.buildingAtTile(this.x, this.y + 1)!.acceptItem(
				new Item((this.x + 0.5) * consts.TILE_SIZE, (this.y + 1.1) * consts.TILE_SIZE, id, this.level)
			)
		){
			return true;
		} else if(
			["0x0201", "0x0601", "0x0A01", "0x0E01", "0x1001", "0x1101", "0x1201", "0x1601", "0x1701", "0x1901", "0x1A01", "0x1B01"]
			.includes(this.level.buildingIDAtTile(this.x - 1, this.y)) &&
			this.level.buildingAtTile(this.x - 1, this.y)!.acceptItem(
				new Item((this.x - 0.1) * consts.TILE_SIZE, (this.y + 0.5) * consts.TILE_SIZE, id, this.level)
			)
		){
			return true;
		} else if(
			["0x0301", "0x0801", "0x0401", "0x0C01", "0x1001", "0x1201", "0x1301", "0x1401", "0x1501", "0x1801", "0x1A01", "0x1B01"]
			.includes(this.level.buildingIDAtTile(this.x, this.y - 1)) &&
			this.level.buildingAtTile(this.x, this.y - 1)!.acceptItem(
				new Item((this.x + 0.5) * consts.TILE_SIZE, (this.y - 0.1) * consts.TILE_SIZE, id, this.level)
			)
		){
			return true;
		} else {
			return false;
		}
	}
	acceptItem(item:Item):boolean{
		if(this.item === null){
			this.item = item;
			item.grabbedBy = this;
			return true;
		} else {
			return false;
		}
	}
	export():BuildingData {
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			item: this.item?.export() ?? null,
			inv: []
		};
	}
}



abstract class BuildingWithRecipe extends Building {
	timer: number;
	recipe: Recipe | null = null;
	items: Item[];
	static recipeType: {recipes: Recipe[]};
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		if(this.constructor === BuildingWithRecipe) throw new Error("Cannot initialize abstract class BuildingWithRecipe");
		this.timer = -1;
		this.items = [];
	}
	acceptItem(item:Item):boolean {
		for(let i = 0; i < consts.recipeMaxInputs; i ++){
			//repeat recipeMaxInputs times
			if(!this.items[i] && !this.items.map(item => item.id).includes(item.id)){
				//if there is nothing in this item slot and the new item's id is not in the list of current items' ids
				for(let recipe of (this.constructor as typeof BuildingWithRecipe).recipeType.recipes){
					//for each recipe this building can do
					if(!recipe.inputs) continue;//If the recipe has no inputs, it cant be the right one
					if(!this.items.map(item => recipe.inputs!.includes(item.id)).includes(false) && recipe.inputs.includes(item.id)){
						//if all of the current items are inputs of the recipe and the item is an input of the recipe
						this.items[i] = item;
						item.grabbedBy = this;
						if(recipe.inputs.length == i + 1){
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
	hasItem(){
		return null;
	}
	removeItem(){
		return null;
	}
	setRecipe(recipe:Recipe){
		if(!(recipe.inputs instanceof Array)) throw new ShouldNotBePossibleError("tried to set invalid recipe");
		this.recipe = recipe;
		this.timer = recipe.duration;
	}
	update(){
		if(this.timer > 0){
			this.timer --;
		} else if(this.timer == 0 && this.recipe){
			if(this.spawnItem(this.recipe.outputs[0])){
				this.timer = -1;
				this.items = [];
				this.recipe = null;
			}
		}
	}
}


class Miner extends Building {
	timer: number;
	miningItem: ItemID | null = null;
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.timer = 61;
		for(let recipe of registry.recipes.base_mining.recipes){
			if(recipe.tile == level.tileAtByTile(tileX, tileY)){
				this.miningItem = recipe.outputs[0];
				return;
			}
		}
		console.warn(`Miner cannot mine tile at ${tileX}, ${tileY}`);
	}
	static canBuildAt(tileX:number, tileY:number, level:Level):boolean {
		return +level.tileAtByTile(tileX, tileY) >> 4 == 1;
	}
	update(){
		if(!this.miningItem) return;
		if(this.timer > 0){
			this.timer --;
		} else {
			if(this.spawnItem(this.miningItem)){
				this.timer = 61;
				trigger(triggerType.buildingRun, getRawBuildingID(this.id), this.miningItem);
			}
		}
	}
}



class TrashCan extends Building {
	acceptItem(item:Item){
		return true;
	}
}


class Furnace extends BuildingWithRecipe {
	static recipeType = registry.recipes.base_smelting;
	static animated = true;
}

class Conveyor extends Building {
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.item = null;
	}
	display(currentFrame:CurrentFrame){
		super.display(currentFrame);
		if(this.item instanceof Item){
			this.item.display(currentFrame);
		}
	}
	update(){
		if(this.item instanceof Item){
			if(Math.floor(this.item.x / consts.TILE_SIZE) != this.x || Math.floor(this.item.y / consts.TILE_SIZE) != this.y){
				let building = this.level.buildingAtTile(Math.floor(this.item.x / consts.TILE_SIZE), Math.floor(this.item.y / consts.TILE_SIZE));
				if(!building) return;
				if(building.acceptItem(this.item)){
					this.item = null;
				}
				return;
			}
			switch(+this.id >> 8){//bit masks ftw, this just grabs the first byte
				//yes I know there's no need to write the ids in hex but why the heck not
				case 0x00:
					if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x += consts.buildings.conveyor.SPEED;
					}
					break;
				case 0x01:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.y += consts.buildings.conveyor.SPEED;
					}
					break;
				case 0x02:
					if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x -= consts.buildings.conveyor.SPEED;
					}
					break;
				case 0x03:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.y -= consts.buildings.conveyor.SPEED;
					}
					break;
				case 0x04:
					if(pixelOffsetInTile(this.item.x) >= consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					}
					break;
				case 0x05:
					if(pixelOffsetInTile(this.item.x) >= consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					}
					break;
				case 0x06:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelOffsetInTile(this.item.x) > consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x07:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelOffsetInTile(this.item.x) < consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x08:
					if(pixelOffsetInTile(this.item.x) <= consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					}
					break;
				case 0x09:
					if(pixelOffsetInTile(this.item.x) <= consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					}
					break;
				case 0x0A:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelOffsetInTile(this.item.x) > consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x0B:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelOffsetInTile(this.item.x) < consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;



				case 0x0C:
					if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					}
					break;
				case 0x0D:
					if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					}
					break;
				case 0x0E:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelOffsetInTile(this.item.x) > consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x0F:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelOffsetInTile(this.item.x) < consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x10:
					if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					}
					break;
				case 0x11:
					if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					}
					break;
				case 0x12:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelOffsetInTile(this.item.x) > consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x13:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelOffsetInTile(this.item.x) < consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				
				
				
				case 0x14:
					if(pixelOffsetInTile(this.item.x) >= consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y += pixelOffsetInTile(this.item.y) > consts.TILE_SIZE / 2 ? -1 : 1;
					}
					break;
				case 0x15:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x += pixelOffsetInTile(this.item.x) > consts.TILE_SIZE / 2 ? -1 : 1;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x16:
					if(pixelOffsetInTile(this.item.x) <= consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y -= pixelOffsetInTile(this.item.y) > consts.TILE_SIZE / 2 ? -1 : 1;
					}
					break;
				case 0x17:
					if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelOffsetInTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x -= pixelOffsetInTile(this.item.x) > consts.TILE_SIZE / 2 ? -1 : 1;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x18:
					if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y += pixelOffsetInTile(this.item.y) > consts.TILE_SIZE / 2 ? -1 : 1;
					}
					break;
				case 0x19:
					if(pixelOffsetInTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x += pixelOffsetInTile(this.item.x) > consts.TILE_SIZE / 2 ? -1 : 1;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
				case 0x1A:
					if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelOffsetInTile(this.item.x) == consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y -= pixelOffsetInTile(this.item.y) > consts.TILE_SIZE / 2 ? -1 : 1;
					}
					break;
				case 0x1B:
					if(pixelOffsetInTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelOffsetInTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x -= pixelOffsetInTile(this.item.x) > consts.TILE_SIZE / 2 ? -1 : 1;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					}
					break;
			}
		}
	}
	acceptItem(item: Item):boolean {
		if(item.x - this.x * consts.TILE_SIZE <= consts.TILE_SIZE * 0.1 &&
			[0x00, 0x07, 0x0B, 0x0C, 0x0D, 0x0F, 0x13, 0x15, 0x17, 0x18, 0x19, 0x1B].includes(+this.id >> 8)){
			//item on left
			return super.acceptItem(item);
		}
		if(item.y - this.y * consts.TILE_SIZE <= consts.TILE_SIZE * 0.1 &&
			[0x01, 0x05, 0x09, 0x0D, 0x0E, 0x0F, 0x11, 0x14, 0x16, 0x18, 0x19, 0x1A].includes(+this.id >> 8)){
			//item on top
			return super.acceptItem(item);
		}
		if(item.x - this.x * consts.TILE_SIZE >= consts.TILE_SIZE * 0.9 &&
			[0x02, 0x06, 0x0A, 0x0E, 0x10, 0x11, 0x12, 0x16, 0x17, 0x19, 0x1A, 0x1B].includes(+this.id >> 8)){
			//item on right
			return super.acceptItem(item);
		}
		if(item.y - this.y * consts.TILE_SIZE >= consts.TILE_SIZE * 0.9 &&
			[0x03, 0x08, 0x04, 0x0C, 0x10, 0x12, 0x13, 0x14, 0x15, 0x18, 0x1A, 0x1B].includes(+this.id >> 8)){
			//item on bottom
			return super.acceptItem(item);
		}
		if(
			pixelOffsetInTile(item.x) == consts.TILE_SIZE / 2 &&
			pixelOffsetInTile(item.y) == consts.TILE_SIZE / 2 &&
			super.acceptItem(item)
		){
			item.x = (this.x + 0.5) * consts.TILE_SIZE;
			item.y = (this.y + 0.5) * consts.TILE_SIZE;
			return true;
		}
		return false;
	}
}


class Extractor extends Conveyor {
	constructor(x:number, y:number, id:BuildingID, level:Level){
		super(x, y, id, level);
	}

	display(currentFrame:CurrentFrame){
		super.display(currentFrame);
		if(this.item instanceof Item){
			this.item.display(currentFrame);
		}
	}

	grabItemFromTile(filter?:(item:Item) => any, callback?:(item:Item) => void, remove?:boolean, grabDistance?:number){
		filter ??= (item) => {return item instanceof Item;};
		callback ??= () => {};

		if(
			this.level.buildingAtTile(this.x, this.y) instanceof Building &&
			this.level.buildingAtTile(this.x, this.y)!.hasItem() &&
			filter(this.level.buildingAtTile(this.x, this.y)!.hasItem()!)
		){
			let item = this.level.buildingAtTile(this.x, this.y)!.removeItem();
			if(!(item instanceof Item)) throw new ShouldNotBePossibleError("received invalid item");
			if(item.deleted) throw new ShouldNotBePossibleError("received deleted item");
			this.item = item;
			this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
			this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
			item.grabbedBy = this;
		}

	}

	dropItem(){
		if(this.item instanceof Item){
			if(this.level.buildingAtPixel(this.item.x, this.item.y)?.acceptItem(this.item)){
				this.item = null;
			}
		} else {
			console.error(this);
			throw new InvalidStateError(`no item to drop; extractor at ${this.x} ${this.y}`);
		}
	}

	update(){
		if(this.item instanceof Item){
			if(this.item.grabbedBy != this || this.item.deleted){
				console.error(this.item);
				console.error(this);
				throw new InvalidStateError("Item somehow grabbed or deleted from an extractor.");
			}

			switch(this.id){
				case "0x0005":
					if(this.item.x >= (this.x + 1.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.x ++;
					}
					break;
				case "0x0105":
					if(this.item.y >= (this.y + 1.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.y ++;
					}
					break;
				case "0x0205":
					if(this.item.x <= (this.x - 0.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.x --;
					}
					break;
				case "0x0305":
					if(this.item.y <= (this.y - 0.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.y --;
					}
					break;
				case "0x0405":
					if(this.item.x >= (this.x + 2.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.x ++;
					}
					break;
				case "0x0505":
					if(this.item.y >= (this.y + 2.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.y ++;
					}
					break;
				case "0x0605":
					if(this.item.x <= (this.x - 1.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.x --;
					}
					break;
				case "0x0705":
					if(this.item.y <= (this.y - 1.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.y --;
					}
					break;
				case "0x0805":
					if(this.item.x >= (this.x + 3.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.x ++;
					}
					break;
				case "0x0905":
					if(this.item.y >= (this.y + 3.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.y ++;
					}
					break;
				case "0x0A05":
					if(this.item.x <= (this.x - 2.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.x --;
					}
					break;
				case "0x0B05":
					if(this.item.y <= (this.y - 2.5) * consts.TILE_SIZE){return this.dropItem();} else {
						this.item.y --;
					}
					break;
			}
		} else {
			this.grabItemFromTile();
		}
	}

	break(){
		if(this.item){
			this.item.grabbedBy = null;
		}
		this.level.writeExtractor(this.x, this.y, null);
	}
}

interface StorageInventory extends Array<Item> {
	MAX_LENGTH: number;
}
class StorageBuilding extends Building {
	inventory: StorageInventory;
	constructor(tileX:number, tileY: number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		let temp:any = [];
		temp.MAX_LENGTH = 64;
		this.inventory = temp;
	}
	break(){
		if(this.inventory){
			for(let item of this.inventory){
				item.grabbedBy = null;
			}
		}
		super.break();
	}
	hasItem(){
		if(this.inventory && this.inventory?.length != 0) return this.inventory[0];
		return super.hasItem();
	}
	removeItem(){
		if(this.inventory?.length > 0){
			return this.inventory.pop()!;
		}
		return super.removeItem();
	}
	acceptItem(item:Item) {
		if(this.inventory?.length < this.inventory?.MAX_LENGTH){
			this.inventory.push(item);
			return true;
		} else return super.acceptItem(item);
	}
	export():BuildingData {
		let inv:ItemData[] = [];
		if(this.inventory){
			for(let item of this.inventory){
				const data = item.export();
				if(data) inv.push(data);
			}
		}
		return {
			x: this.x,
			y: this.y,
			id: this.id,
			item: this.item?.export() ?? null,
			inv: inv
		};
	}
}


class ResourceAcceptor extends Building {
	acceptItem(item:Item){
		item.deleted = true;
		item.grabbedBy = null;
		if(! this.level.resources[item.id]){
			this.level.resources[item.id] = 0;
		}
		this.level.resources[item.id] ++;
		return true;
	}
}

//I love abstraction
class AlloySmelter extends BuildingWithRecipe {
	static animated = true;
	static recipeType = registry.recipes.base_alloying;
}

class Wiremill extends BuildingWithRecipe {
	static recipeType = registry.recipes.base_wiremilling;
}

class Compressor extends BuildingWithRecipe {
	static recipeType = registry.recipes.base_compressing;
}

class Lathe extends BuildingWithRecipe {
	static recipeType = registry.recipes.base_lathing;
}


class MultiBlockController extends BuildingWithRecipe {
	secondaries: MultiBlockSecondary[];
	static size = [1, 1];
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.secondaries = [];
	}
	break(){
		this.secondaries.forEach(secondary => secondary.break(true));
		this.secondaries = [];
		super.break();
	}
	update(): void {
		if(this.secondaries.length != (this.constructor as typeof MultiBlockController).size[0] * (this.constructor as typeof MultiBlockController).size[1] - 1){
			//try to reconnect to secondaries
			//would most likely happen on loading a save
			let possibleSecondaries = [
				this.level.buildingAtTile(this.x + 1, this.y),
				this.level.buildingAtTile(this.x, this.y + 1),
				this.level.buildingAtTile(this.x + 1, this.y + 1)
			];
			for(let possibleSecondary of possibleSecondaries){
				if(possibleSecondary instanceof MultiBlockSecondary && (possibleSecondary.controller == this || possibleSecondary.controller == undefined)){
					possibleSecondary.controller = this;
					this.secondaries.push(possibleSecondary);
				} else {
					//cannot reconnect to secondary, break
					return this.break();
				}
			}
			console.warn("Multiblock disconnected from secondaries. If you just loaded a save, this is fine.");
		}
		super.update();
	}
	spawnItem(id: ItemID):boolean {
		if(super.spawnItem(id)){
			return true;
		}
		for(let secondary of this.secondaries){
			if(secondary.spawnItem(id)){
				return true;
			}
		}
		return false;
	}
}

class MultiBlockSecondary extends Building {
	/**Assigned in buildBuilding */
	controller: MultiBlockController | null = null;
	acceptItem(item: Item):boolean {
		return this.controller?.acceptItem(item) ?? false;
	}
	break(isRecursive?:boolean){
		if(!isRecursive){
			this.controller?.break();
		} else {
			this.controller = null;
			super.break();
		}
	}
	display(currentFrame:CurrentFrame){}
	update(){
		if(!(this.controller instanceof MultiBlockController)){
			this.break();
		}
	}
}

class Assembler extends MultiBlockController {
	static recipeType = registry.recipes.base_assembling;
	static size = [2, 2];
}


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
	"0xFF": null! //TODO! fix this
};
