
type Tile = 
0x00 |  //Blank
0x01 |  //stone
0x02 |  //iron ore
0x03 |  //coal ore
0x04 |	//water
0xFF ;  //Unset
type BuildingID = 
//0x0000 is invalid
0x0001 |	//Conveyor Belt Facing Right
0x0101 |	//Conveyor Belt Facing Down
0x0201 |	//Conveyor Belt Facing Left
0x0301 |	//Conveyor Belt Facing Up
0x0401 |	//Conveyor Belt Facing Down->Right
0x0501 |	//Conveyor Belt Facing Up->Right
0x0601 |	//Conveyor Belt Facing Right->Down
0x0701 |	//Conveyor Belt Facing Left->Down
0x0801 |	//Conveyor Belt Facing Down->Left
0x0901 |	//Conveyor Belt Facing Up->Left
0x0A01 |	//Conveyor Belt Facing Right->Up
0x0B01 |	//Conveyor Belt Facing Left->Up
0x0002 |	//Miner
0x0003 |	//Trash Can
0x0004 |	//Furnace
0x0005 |	//Extractor Facing Right
0x0105 |	//Extractor Facing Down
0x0205 |	//Extractor Facing Left
0x0305 |	//Extractor Facing Up
0x0006 |	//Chest
0x0007 |	//Alloy Smelter
0xFFFF ;	//Unset

type RawBuildingID = 0x0001 | 0x0002 | 0x0003 | 0x0004 | 0x0005 | 0x0006 | 0x0007 | 0xFFFF;




let textures = new Map();

const names = {
	tile: {
		0x00: "Grass",
		0x01: "Stone",
		0x02: "Coal Ore Node",
		0x03: "Iron Ore Node",
		0x04: "Water"
	},
	building: {
		0x01: "Conveyor Belt",
		0x02: "Miner",
		0x03: "Trash Can",
		0x04: "Furnace",
		0x05: "Extractor",
		0x06: "Storage"
	},
	item: {
		"base_null": "Debug Item",
		"base_coalOre": "Coal Ore",
		"base_coal": "Coal",
		"base_ironOre": "Iron Ore",
		"base_ironIngot": "Iron Ingot"
	}
};

const ItemID = {
	"base_null": "base_null",
	"base_coalOre": "base_coalOre",
	"base_coal": "base_coal",
	"base_ironOre": "base_ironOre",
	"base_ironIngot": "base_ironIngot"
}

const rands = {
	x_prime: 1299689,
	y_prime: 1156709,
	hill_x: 89,
	hill_y: 11,
	ore_type: 103
}

const consts = {
	VERSION: "alpha 0.0.0",
	CHUNK_SIZE: 16,
    TILE_SIZE: 30,
    DISPLAY_SCALE: 1,
		get DISPLAY_TILE_SIZE(){
			return this.TILE_SIZE * this.DISPLAY_SCALE;
    },
    buildings: {
			conveyor: {
				SPEED: 1
			}
    }
}

class ChunkedDataStorage<Layer1,Layer2,Layer3> {
	storage: Map<string, Chunk<Layer1,Layer2,Layer3>>;
	seed: number;
	format: string;
	defaults: {layer1: Layer1, layer2: Layer2, layer3: Layer3};
	constructor(seed:number | null, defaults: {layer1: Layer1, layer2: Layer2, layer3: Layer3}){
		this.storage = new Map<string, Chunk<Layer1,Layer2,Layer3>>();
		this.seed = seed ? seed : 0;
		this.defaults = defaults;
		this.format = consts.VERSION;
	}
	getChunk(tileX:number, tileY:number, dontGenerateChunk?:boolean):Chunk<Layer1,Layer2,Layer3>{
		if(this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`)){
			return this.storage.get(`${Math.floor(tileX / consts.CHUNK_SIZE)},${Math.floor(tileY / consts.CHUNK_SIZE)}`);
		} else if(!dontGenerateChunk){
			return this.generateChunk(Math.floor(tileX / consts.CHUNK_SIZE),Math.floor(tileY / consts.CHUNK_SIZE));
		} else {
			return null;
		}
	}
	generateChunk(x:number, y:number){
		if(this.storage.get(`${x},${y}`)){
			return;
		}
		this.storage.set(`${x},${y}`, 
			new Chunk<Layer1,Layer2,Layer3>(x, y, this.seed, this.defaults.layer1, this.defaults.layer2, this.defaults.layer3)
			.generate()
		);
		console.log(`generated chunk ${x}, ${y}`)
		return this.storage.get(`${x},${y}`);
	}
	atLayer1ByPixel(pixelX:number, pixelY:number):Layer1{
		return this.getChunk(
			Math.floor(pixelX/consts.TILE_SIZE),
			Math.floor(pixelY/consts.TILE_SIZE)
		).atLayer1(tileToChunk(pixelX/consts.TILE_SIZE), tileToChunk(pixelY/consts.TILE_SIZE));
	}
	atLayer1ByTile(tileX:number, tileY:number):Layer1{
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).atLayer1(tileToChunk(tileX), tileToChunk(tileY));
	}
	writeTile(tileX:number, tileY:number, tile:Tile):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setLayer1(tileToChunk(tileX), tileToChunk(tileY), tile);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	generateNecessaryChunks(){
		var xOffset = - Math.floor((Game.scroll.x * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
		var yOffset = - Math.floor((Game.scroll.y * consts.DISPLAY_SCALE) / (consts.DISPLAY_TILE_SIZE * consts.CHUNK_SIZE));
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
}

class Level extends ChunkedDataStorage<Tile, Building, null> {
	items: Item[];
	constructor(seed:number){
		super(seed, {
			layer1: 0x00,
			layer2: null,
			layer3: null
		});
		this.items = [];
	}
	buildingIDAtPixel(pixelX:number, pixelY:number):BuildingID {
		return this.getChunk(
			Math.floor(pixelX/consts.TILE_SIZE),
			Math.floor(pixelY/consts.TILE_SIZE)
		).atLayer2(tileToChunk(pixelX/consts.TILE_SIZE), tileToChunk(pixelY/consts.TILE_SIZE))?.id ?? 0xFFFF;
	}
	buildingIDAtTile(tileX:number, tileY:number):BuildingID {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).atLayer2(tileToChunk(tileX), tileToChunk(tileY))?.id ?? 0xFFFF;
	}
	buildingAt(tileX:number, tileY:number):Building {
		return this.getChunk(
			Math.floor(tileX),
			Math.floor(tileY)
		).atLayer2(tileToChunk(tileX), tileToChunk(tileY));
	}
	addItem(x:number, y:number, id:string){
		let tempitem = new Item(x, y, id, this);
		this.items.push(tempitem);
		return tempitem;
	}
	update(currentframe:any){
		for(var item of this.items){
			item.update(currentframe);
		}
		for(var chunk of level1.storage.values()){
			chunk.update();
		}
	}
	displayGhostBuilding(tileX:number, tileY:number, buildingID:BuildingID){
		tileX = Math.floor(tileX);
		tileY = Math.floor(tileY);
		if(this.getChunk(tileX, tileY, true) == null){
			return;
		}
		switch(buildingID){
			case 0x0007:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, AlloySmelter.canBuildAt(tileX, tileY, this) ? 1 : 2);
			break;
			case 0x0006:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, StorageBuilding.canBuildAt(tileX, tileY, this) ? 1 : 2);
			break;
			case 0x0005: case 0x0105: case 0x0205: case 0x0305:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, Extractor.canBuildAt(tileX, tileY, this) ? 1 : 2);
			break;
			case 0x0004:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, Furnace.canBuildAt(tileX, tileY, this) ? 1 : 2);
			break;
			case 0x0002:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, Miner.canBuildAt(tileX, tileY, this) ? 1 : 2);
			break;
			case 0x0001: case 0x0101: case 0x0201: case 0x0301:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), this.getTurnedConveyor(tileX, tileY, buildingID >> 8), Conveyor.canBuildAt(tileX, tileY, this) ? 1 : 2);
				break;
			default:
				this.getChunk(tileX, tileY).displayBuilding(tileToChunk(tileX), tileToChunk(tileY), buildingID, 1);
			break;
		}
	}
	getTurnedConveyor(tileX:number, tileY:number, conveyorType:number){
		tileX = Math.floor(tileX);
		tileY = Math.floor(tileY);
		let topConveyor:BuildingID | boolean = this.buildingIDAtTile(tileX, tileY - 1);
		topConveyor = topConveyor == 0x0101 || topConveyor == 0x0601 || topConveyor == 0x0701;
		let rightConveyor:BuildingID | boolean = this.buildingIDAtTile(tileX + 1, tileY);
		rightConveyor = rightConveyor == 0x0201 || rightConveyor == 0x0801 || rightConveyor == 0x0901;
		let leftConveyor:BuildingID | boolean = this.buildingIDAtTile(tileX - 1, tileY);
		leftConveyor = leftConveyor == 0x0001 || leftConveyor == 0x0401 || leftConveyor == 0x0501;
		let bottomConveyor:BuildingID | boolean = this.buildingIDAtTile(tileX, tileY + 1);
		bottomConveyor = bottomConveyor == 0x0301 || bottomConveyor == 0x0A01 || bottomConveyor == 0x0B01;
		let buildingID:BuildingID = 0xFFFF;
		switch(conveyorType){
			case 0:
				if(leftConveyor){
					buildingID = 0x0001;
				} else if(topConveyor && bottomConveyor){
					buildingID = 0x0001;
				} else if(topConveyor){
					buildingID = 0x0501;
				} else if(bottomConveyor){
					buildingID = 0x0401;
				} else {
					buildingID = 0x0001;
				}
				break;
			case 1:
				if(topConveyor){
					buildingID = 0x0101;
				} else if(leftConveyor && rightConveyor){
					buildingID = 0x0101;
				} else if(leftConveyor){
					buildingID = 0x0701;
				} else if(rightConveyor){
					buildingID = 0x0601;
				} else {
					buildingID = 0x0101;
				}
				break;
			case 2:
				if(rightConveyor){
					buildingID = 0x0201;
				} else if(topConveyor && bottomConveyor){
					buildingID = 0x0201;
				} else if(topConveyor){
					buildingID = 0x0901;
				} else if(bottomConveyor){
					buildingID = 0x0801;
				} else {
					buildingID = 0x0201;
				}
				break;
			case 3:
				if(bottomConveyor){
					buildingID = 0x0301;
				} else if(leftConveyor && rightConveyor){
					buildingID = 0x0301;
				} else if(leftConveyor){
					buildingID = 0x0B01;
				} else if(rightConveyor){
					buildingID = 0x0A01;
				} else {
					buildingID = 0x0301;
				}
				break;
		}
		return buildingID;
	}
	writeBuilding(tileX:number, tileY:number, building:Building):boolean {
		if(this.getChunk(tileX,tileY)){
			this.getChunk(tileX,tileY).setLayer2(tileToChunk(tileX), tileToChunk(tileY), building);
			Game.forceRedraw = true;
			return true;
		}
		return false;
	}
	buildBuilding(tileX:number, tileY:number, building:BuildingID):boolean {
		if(this.buildingIDAtTile(tileX, tileY) % 0x100 == building % 0x100){
			this.buildingAt(tileX, tileY)?.break();
		}
		var tempBuilding:Building;
		switch(building){
			case 0x0007:
				if(!AlloySmelter.canBuildAt(tileX, tileY, this)){
					return;
				}
				tempBuilding = new AlloySmelter(tileX, tileY, building, this);
				break;
			case 0x0006:
				if(!StorageBuilding.canBuildAt(tileX, tileY, this)){
					return;
				}
				tempBuilding = new StorageBuilding(tileX, tileY, building, this);
				break;
			case 0x0005: case 0x0105: case 0x0205: case 0x0305:
				if(!Extractor.canBuildAt(tileX, tileY, this)){
					return;
				}
				tempBuilding = new Extractor(tileX, tileY, building, this);
				break;
			case 0x0004:
				if(!Furnace.canBuildAt(tileX, tileY, this)){
					if(Game.tutorial.furnace.cantbeplacedongrass && Game.persistent.tutorialenabled){
						_alert("The Furnace generates a lot of heat and is pretty heavy, so you can only place it on stone.");
						Game.tutorial.furnace.cantbeplacedongrass = false;
					}
					return;
				}
				tempBuilding = new Furnace(tileX, tileY, 0x0004, this);
				if(Game.tutorial.furnace.placedcorrectly && Game.persistent.tutorialenabled){
					_alert("The Furnace converts raw ores into their smelted forms. Simply point a conveyor belt carrying ores at it and \n>provide another belt<\n for it to output onto.");
					Game.tutorial.furnace.placedcorrectly = false;
				}
			break;
			case 0x0003:
				tempBuilding = new TrashCan(tileX, tileY, 0x0003, this);
				if(Game.tutorial.trashcan.placedcorrectly && Game.persistent.tutorialenabled){
					_alert("The Trash Can is pretty simple: it deletes all items it receives.");
					Game.tutorial.trashcan.placedcorrectly = false;
				}
			break;
			case 0x0002:
				if(!Miner.canBuildAt(tileX, tileY, this)){
					if(Game.tutorial.miner.cantbeplacedongrass && Game.persistent.tutorialenabled){
						_alert("The Miner can only be placed on a resource node.");
						Game.tutorial.miner.cantbeplacedongrass = false;
					}
					return;
				};
				tempBuilding = new Miner(tileX, tileY, 0x0002, this);
				if(Game.tutorial.miner.placedcorrectly && Game.persistent.tutorialenabled){
					_alert("🎉🎉\nThe Miner mines ore nodes, producing one ore per second. \n>It auto-outputs to adjacent conveyor belts.<\nAlso, ore nodes are infinite.\nBe warned, the miner will continue producing ore forever, which could lead to lag.");
					Game.tutorial.miner.placedcorrectly = false;
				}
			break;
			case 0x0001: case 0x0101: case 0x0201: case 0x0301: case 0x0401: case 0x0501: case 0x0601: case 0x0701: case 0x0801: case 0x0901: case 0x0A01: case 0x0B01:
				if(!Conveyor.canBuildAt(tileX, tileY, this)){
					if(Game.tutorial.conveyor.cantbeplacedonwater && Game.persistent.tutorialenabled){
						_alert("Conveyors don't float!\nYes, I know, then water chunks are useless... I'll add pontoons in a future update.");
						Game.tutorial.conveyor.cantbeplacedonwater = false;
					}
					return;
				}
				if(Game.tutorial.conveyor.placedcorrectly && Game.persistent.tutorialenabled){
					_alert("Conveyors are the way to move items around. \nYou can use the arrow keys to change the direction of placed belts. \nTry making a belt chain, then putting a debug item on it with Ctrl+click.");
					Game.tutorial.conveyor.placedcorrectly = false;
				}
				tempBuilding = new Conveyor(tileX, tileY, this.getTurnedConveyor(tileX, tileY, building >> 8), this);
			break;
			default:
				return this.writeBuilding(tileX, tileY, new Building(tileX, tileY, building, this));
			break;
		}
		this.writeBuilding(tileX, tileY, tempBuilding);
		return true;
	}
	display(currentframe:Object):void {
		for(let item of this.items){
			item.display(currentframe);
		}
		
		//Insta returns in the display method if offscreen.
		for(var chunk of this.storage.values()){
			chunk.display(currentframe);
		}
		
	}
	displayTooltip(mousex:number, mousey:number, currentframe:any){
		if(!currentframe.tooltip){return;}
		var x = (mousex - (Game.scroll.x * consts.DISPLAY_SCALE))/consts.DISPLAY_SCALE;
		var y = (mousey - (Game.scroll.y * consts.DISPLAY_SCALE))/consts.DISPLAY_SCALE;
		ctx4.font = "16px monospace";
		if(this.buildingIDAtPixel(x, y) !== 0xFFFF){
			let buildingID = this.buildingIDAtPixel(x, y) % 0x100;
			ctx4.fillStyle = "#0033CC";
			ctx4.fillRect(mousex, mousey, names.building[buildingID].length * 10, 16);
			ctx4.strokeStyle = "#000000";
			ctx4.strokeRect(mousex, mousey, names.building[buildingID].length * 10, 16);
			ctx4.fillStyle = "#FFFFFF";
			ctx4.fillText(names.building[buildingID], mousex + 2, mousey + 10);
			return;
		}
		let tileID = this.atLayer1ByPixel(x, y);
		ctx4.fillStyle = "#0033CC";
		ctx4.fillRect(mousex, mousey, names.tile[tileID].length * 10, 16);
		ctx4.strokeStyle = "#000000";
		ctx4.strokeRect(mousex, mousey, names.tile[tileID].length * 10, 16);
		ctx4.fillStyle = "#FFFFFF";
		ctx4.fillText(names.tile[tileID], mousex + 2, mousey + 10);
		return;
	}
}



class Chunk<Layer1,Layer2,Layer3> {
	layers: [
		Layer1[][],
		Layer2[][],
		Layer3[][]
	];
	chunkSeed: number;
	x: number;
	y: number;
	isWet: boolean;
	constructor(x:number, y:number, seed:number, defaultValue1:Layer1, defaultValue2:Layer2, defaultValue3:Layer3){
		this.x = x;
		this.y = y;
		this.chunkSeed = Math.abs(Math.round(
			seed * (x ? x : 23) * rands.x_prime +
			seed * (y ? y : 133) * rands.y_prime +
			Math.pow((Math.abs(x + y) % 10) + 10, (seed % 10) + 10) +
			123456789
		)) % 2147483648;
		this.layers = [
			null,//Ground(ground, dirt)
			null,//Buildings
			null//Reserved
		];

		this.layers[0] = [];
		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[0][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[0][x].push(defaultValue1);
			}
		}

		this.layers[1] = [];
		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[1][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[1][x].push(defaultValue2);
			}
		}

		this.layers[2] = [];
		for(let x = 0; x < consts.CHUNK_SIZE; x ++){
			this.layers[2][x] = [];
			for(let z = 0; z < consts.CHUNK_SIZE; z ++){
				this.layers[2][x].push(defaultValue3);
			}
		}

		return this;
	}
	generate():Chunk<Layer1,Layer2,Layer3> {
		//Put down the base
		this.isWet = this.chunkSeed < 134217728 && Math.abs(this.x) > 3 && Math.abs(this.y) > 3;
		for(var row in this.layers[0]){
			for(var tile in this.layers[0][row]){
				this.layers[0][row][tile] = (this.isWet ? 0x04 : 0x00 as any);//TODO: somehow fix this, any bad
			}
		}

		if(!this.isWet){
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, (((this.chunkSeed - rands.ore_type) % 3) > 1 && (Math.abs(this.x) > 1 || Math.abs(this.y) > 1)) ? 0x03 : 0x02);
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE, 0x01);
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, 0x01);
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, 0x01);
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 4 > 1) ? 0x01 : 0x00);
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE + 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 8 > 3) ? 0x01 : 0x00);
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE + 1, (this.chunkSeed % 16 > 7) ? 0x01 : 0x00);
			this.setLayer1((this.chunkSeed - rands.hill_x) % consts.CHUNK_SIZE - 1, (this.chunkSeed - rands.hill_y) % consts.CHUNK_SIZE - 1, (this.chunkSeed % 32 > 15) ? 0x01 : 0x00);
		}

		if(this.isWet){
			this.setLayer1(7, 7, 0x02);
			this.setLayer1(8, 7, 0x03);
			this.setLayer1(7, 8, 0x03);
			this.setLayer1(8, 8, 0x02);
			this.setLayer1(6, 7, 0x01);
			this.setLayer1(7, 6, 0x01);
			this.setLayer1(6, 8, 0x01);
			this.setLayer1(8, 6, 0x01);
			this.setLayer1(8, 9, 0x01);
			this.setLayer1(9, 8, 0x01);
			this.setLayer1(7, 9, 0x01);
			this.setLayer1(9, 7, 0x01);
		}

		return this;
	}
	update():Chunk<Layer1,Layer2,Layer3> {
		for(var row of this.layers[1] as any[][]){
			for(var value of row){
				if(typeof value?.update == "function"){
					value.update();
				}
			}
		}
		return this;
	}
	atLayer1(tileX:number, tileY:number):Layer1 {
		return this.layers[0]?.[tileY]?.[tileX] ?? null;
	}
	atLayer2(x:number, y:number):Layer2 {
		return this.layers[1]?.[y]?.[x] ?? null;
	}
	setLayer1(x:number, y:number, value:any):boolean {//todo fix, any bad
		if(this.atLayer1(x, y) == null){
			return false;
		}
		this.layers[0][y][x] = value;
		return true;
	}
	setLayer2(x:number, y:number, value:Layer2):boolean {
		if(this.atLayer1(x, y) == null){
			return false;
		}
		this.layers[1][y][x] = value;
		return true;
	}
	/**
	 * @deprecated
	 */
	displayToConsole(){
		console.log(`%c Base layer of chunk [${this.x},${this.y}]`, `font-weight: bold;`);
		console.table(this.layers[0]);
	}
	display(currentframe:any){
		if(
			(Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerWidth + 1 ||
			(Game.scroll.x * consts.DISPLAY_SCALE) + this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE ||
			(Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE > window.innerHeight + 1 ||
			(Game.scroll.y * consts.DISPLAY_SCALE) + this.y * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE < -1 - consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE
		){return false;}//if offscreen return immediately
		currentframe.cps ++;
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 1;
		
		if(currentframe.redraw){
			for(let y = 0; y < this.layers[0].length; y ++){
				for(let x = 0; x < this.layers[0][y].length; x ++){
					this.displayTile(x, y, currentframe);//todo fix, any bad
				}
			}
			for(let y = 0; y < this.layers[0].length; y ++){
				for(let x = 0; x < this.layers[0][y].length; x ++){
					this.displayBuilding(x, y, (this.atLayer2(tileToChunk(x), tileToChunk(y)) as unknown as Building)?.id ?? 0xFFFF);//todo fix, any bad
				}
			}
		}
		if(currentframe.debug){
			ctx4.strokeStyle = "#0000FF";
			ctx4.strokeRect(this.x * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE), this.y  * consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE), consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE, consts.CHUNK_SIZE * consts.DISPLAY_TILE_SIZE);
		}
	}
	displayTile(x:number, y:number, currentframe){
		currentframe.tps ++;
		let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
		let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
		if(settings.graphics_mode || (this.atLayer1(x,y) as any as Tile) != 0x00){
			ctx.drawImage(textures.get("t" + this.atLayer1(x,y).toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
		} else {
			ctx.fillStyle = "#00CC33";
			rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
		}
		/*switch(this.tileAt(x, y)){
			case 0x00:
				ctx.fillStyle = "#00CC33";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				break;
			case 0x01:
				ctx.fillStyle = "#999999";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				break;
			case 0x02:
				ctx.fillStyle = "#666666";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				ctx.fillStyle = "#000000";
				ellipse(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.25, consts.DISPLAY_TILE_SIZE * 0.25);
				break;
			case 0x03:
				ctx.fillStyle = "#666666";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				ctx.fillStyle = "#CBCDCD";
				ellipse(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.25, consts.DISPLAY_TILE_SIZE * 0.25);
				break;
			case 0x04:
				ctx.fillStyle = "#0033CC";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
				break;
			case 0xFF:
				ctx.fillStyle = "#FF00FF";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				ctx.fillStyle = "#000000";
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2);
				break;
			default:
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
		*/
		if(currentframe.debug) ctx.strokeRect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
	}
	displayBuilding(x:number, y:number, buildingID:BuildingID, isGhost?:number){
		if(buildingID == 0xFFFF){return;}
		let pixelX = ((this.x * consts.CHUNK_SIZE) + x) * consts.DISPLAY_TILE_SIZE + (Game.scroll.x * consts.DISPLAY_SCALE);
		let pixelY = ((this.y * consts.CHUNK_SIZE) + y) * consts.DISPLAY_TILE_SIZE + (Game.scroll.y * consts.DISPLAY_SCALE);
		let _ctx = isGhost ? ctx1 : ctx2;
		if(isGhost == 2){
			_ctx.strokeStyle = "#FF0000";
			_ctx.fillStyle = "#FF0000";
			_ctx.lineWidth = 2;
		} else if(isGhost == 1){
			_ctx.strokeStyle = "#444444";
			_ctx.fillStyle = "#444444";
			_ctx.lineWidth = 1;
		} else if(textures.get(buildingID.toString())){
			return _ctx.drawImage(textures.get(buildingID.toString()), pixelX, pixelY, consts.DISPLAY_TILE_SIZE, consts.DISPLAY_TILE_SIZE);
		} else {
			throw "MissingTextureError: " + buildingID.toString();
		}
		switch(buildingID){
			case 0x0001:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				_ctx.stroke();
				break;
			case 0x0101:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				_ctx.stroke();
				break;
			case 0x0201:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				_ctx.stroke();
				break;
			case 0x0301:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				_ctx.stroke();
				break;
			case 0x0401:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				_ctx.stroke();
				break;
			case 0x0501:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.6, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				_ctx.stroke();
				break;
			case 0x0601:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				_ctx.stroke();
				break;
			case 0x0701:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.6);
				_ctx.stroke();
				break;
			case 0x0801:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.9);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				_ctx.stroke();
				break;
			case 0x0901:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.3);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.4, pixelY + consts.DISPLAY_TILE_SIZE * 0.7);
				_ctx.stroke();
				break;
			case 0x0A01:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.9, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				_ctx.stroke();
				break;
			case 0x0B01:
				_ctx.beginPath();
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.3, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				_ctx.moveTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.1);
				_ctx.lineTo(pixelX + consts.DISPLAY_TILE_SIZE * 0.7, pixelY + consts.DISPLAY_TILE_SIZE * 0.4);
				_ctx.stroke();
				break;
				
			case 0x0002:
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.6, rectMode.CENTER, _ctx);
				break;
			
			case 0x0003:
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.6, consts.DISPLAY_TILE_SIZE * 0.6, rectMode.CENTER, _ctx);
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.1, pixelY + consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.1, rectMode.CORNER, _ctx);
				break;
			
			case 0x0004:
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
				_ctx.fillStyle = "#FFCC11";
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.4, consts.DISPLAY_TILE_SIZE * 0.4, rectMode.CENTER, _ctx);
				break;
			
			case 0x0006:
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
				_ctx.fillStyle = "#CCCCCC";
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.45, pixelY + consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.1, consts.DISPLAY_TILE_SIZE * 0.3, rectMode.CORNER, _ctx);
				break;
			
			case 0x0007:
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.8, consts.DISPLAY_TILE_SIZE * 0.8, rectMode.CENTER, _ctx);
				_ctx.fillStyle = "#FF0000";
				rect(pixelX + consts.DISPLAY_TILE_SIZE * 0.5, pixelY + consts.DISPLAY_TILE_SIZE * 0.5, consts.DISPLAY_TILE_SIZE * 0.4, consts.DISPLAY_TILE_SIZE * 0.4, rectMode.CENTER, _ctx);
				break;

			default:
				_ctx.fillStyle = "#FF00FF";
				rect(pixelX, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
				_ctx.fillStyle = "#000000";
				rect(pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
				rect(pixelX, pixelY + consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, consts.DISPLAY_TILE_SIZE / 2, rectMode.CORNER, _ctx);
				_ctx.font = "15px sans-serif";
				_ctx.fillStyle = "#00FF00";
				_ctx.fillText(buildingID.toString(), pixelX + consts.DISPLAY_TILE_SIZE / 2, pixelY + consts.DISPLAY_TILE_SIZE / 2);
				break;
		}
	}
}


class Item {
	id: string;
	x: number;
	y: number;
	level: Level;
	startY: number | undefined;
	startX: number | undefined;
	grabbedBy: Building;
	deleted: boolean;
	constructor(x:number, y:number, id:string, level:Level){
		this.id = id;
		this.x = x;
		this.y = y;
		this.level = level;
		this.grabbedBy = null;
		this.deleted = false;
		if(this.id == ItemID.base_null){
			this.startX = x;
			this.startY = y;
		}
	}
	update(currentframe:any){
		if(Game.tutorial.conveyor.beltchain && Game.persistent.tutorialenabled && ((Math.abs(this.startX - this.x) + 1 > consts.TILE_SIZE * 2) || (Math.abs(this.startY - this.y) + 1 > consts.TILE_SIZE * 2))){
			_alert("Nice!\nConveyor belts are also the way to put items in machines.\nSpeaking of which, let's try automating coal: Place a Miner(2 key).");
			Game.tutorial.conveyor.beltchain = false;
		}
		if(this.deleted){
			//do stuff
		}
	}
	display(currentframe:any){
		ctx3.drawImage(textures.get("item_" + this.id), this.x * consts.DISPLAY_SCALE + (Game.scroll.x * consts.DISPLAY_SCALE) - 8*consts.DISPLAY_SCALE, this.y * consts.DISPLAY_SCALE + (Game.scroll.y * consts.DISPLAY_SCALE) - 8*consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE, 16 * consts.DISPLAY_SCALE);
		if(keysPressed.indexOf("Shift") != -1){
			var x = (mouseX - (Game.scroll.x * consts.DISPLAY_SCALE))/consts.DISPLAY_SCALE;
			var y = (mouseY - (Game.scroll.y * consts.DISPLAY_SCALE))/consts.DISPLAY_SCALE;
			//alert(this.x + " " + this.y + "  " + x + " " + y);
			if(
				x > this.x - (8 * consts.DISPLAY_SCALE) &&
				y > this.y - (8 * consts.DISPLAY_SCALE) &&
				x < this.x + (8 * consts.DISPLAY_SCALE) &&
				y < this.y + (8 * consts.DISPLAY_SCALE)
			){
				ctx4.font = "16px monospace";
				ctx4.fillStyle = "#0033CC";
				ctx4.fillRect(mouseX, mouseY, names.item[this.id].length * 10, 16);
				ctx4.strokeStyle = "#000000";
				ctx4.strokeRect(mouseX, mouseY, names.item[this.id].length * 10, 16);
				ctx4.fillStyle = "#FFFFFF";
				ctx4.fillText(names.item[this.id], mouseX + 2, mouseY + 10);
				if(currentframe?.tooltip){
					currentframe.tooltip = false;
				}
			}
		}
	}
}

class Building {
	x: number;
	y: number;
	id: BuildingID;
	level: Level;
	constructor(tileX:number, tileY: number, id:BuildingID, level:Level){
		this.x = tileX;
		this.y = tileY;
		this.id = id;
		this.level = level;
	}
	static canBuildAt(tileX:number, tileY:number, level:Level){
		return level.atLayer1ByTile(tileX, tileY) != 0x04;
	}
	break(){
		
	}
	spawnItem(id:string){
		id ??= "base_null";
		if(
				this.level.buildingIDAtTile(this.x + 1, this.y) % 0x100 === 0x01 &&
				this.level.buildingIDAtTile(this.x + 1, this.y) !== 0x0201 &&
				this.level.buildingIDAtTile(this.x + 1, this.y) !== 0x0801 &&
				this.level.buildingIDAtTile(this.x + 1, this.y) !== 0x0901 &&
				(this.level.buildingAt(this.x + 1, this.y) as Conveyor).item == null
		){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, id);
		} else if(
				this.level.buildingIDAtTile(this.x, this.y + 1) % 0x100 === 0x01 &&
				this.level.buildingIDAtTile(this.x, this.y + 1) !== 0x0301 &&
				this.level.buildingIDAtTile(this.x, this.y + 1) !== 0x0A01 &&
				this.level.buildingIDAtTile(this.x, this.y + 1) !== 0x0B01 &&
				(this.level.buildingAt(this.x, this.y + 1) as Conveyor).item == null
		){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 1.1, id);
		} else if(
				this.level.buildingIDAtTile(this.x - 1, this.y) % 0x100 === 0x01 &&
				this.level.buildingIDAtTile(this.x - 1, this.y) !== 0x0001 &&
				this.level.buildingIDAtTile(this.x - 1, this.y) !== 0x0401 &&
				this.level.buildingIDAtTile(this.x - 1, this.y) !== 0x0501 &&
				(this.level.buildingAt(this.x - 1, this.y) as Conveyor).item == null
		){
			this.level.addItem(this.x * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, this.y * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, id);
		} else if(
				this.level.buildingIDAtTile(this.x, this.y - 1) % 0x100 === 0x01 &&
				this.level.buildingIDAtTile(this.x, this.y - 1) !== 0x0101 &&
				this.level.buildingIDAtTile(this.x, this.y - 1) !== 0x0601 &&
				this.level.buildingIDAtTile(this.x, this.y - 1) !== 0x0701 &&
				(this.level.buildingAt(this.x, this.y - 1) as Conveyor).item == null
		){
			this.level.addItem(this.x * consts.TILE_SIZE + consts.TILE_SIZE * 0.5, this.y * consts.TILE_SIZE - consts.TILE_SIZE * 0.1, id);
		} else {
			return false;
		}
		if(Game.persistent.tutorialenabled && id == ItemID.base_coal && Game.tutorial.item.coal){
			_alert("Congratulations! You just automated coal!");
			_alert(["Try doing the same thing for iron: Iron nodes are whiteish and are a bit further from the center of the map.\nUse WASD to scroll.", 3000]);
			Game.tutorial.item.coal = false;
		}
		if(Game.persistent.tutorialenabled && id == ItemID.base_ironIngot && Game.tutorial.item.iron){
			_alert("Nice job!\nWell, that's all the content this game has to offer right now. I would tell you to automate steel, but it doesn't exist yet.\nThis game is currently in alpha, check back later for more updates!");
			Game.tutorial.item.iron = false;
			_alert(["Oh, also, you technically beat the game. Just saying.", 3000]);
		}
		return true;
	}
	grabItem(filter:(item:Item) => any, callback:(item:Item) => void, remove:boolean){
		for(var item in this.level.items){
			if(
				(Math.abs(this.level.items[item].x - ((this.x + 0.5) * consts.TILE_SIZE)) <= consts.TILE_SIZE * 0.5) &&
				(Math.abs(this.level.items[item].y - ((this.y + 0.5) * consts.TILE_SIZE)) <= consts.TILE_SIZE * 0.5) &&
				filter(this.level.items[item])
			){
				this.level.items[item].grabbedBy = this;
				callback(this.level.items[item]);
				if(remove){
					this.level.items.splice(parseInt(item), 1);
				}
				return;
			}
		}
	}
}


class Miner extends Building {
	timer: number;
	miningItem: string;
	oreFor: any;
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.timer = 61;
		this.miningItem = oreFor[level.atLayer1ByTile(tileX, tileY)];
	}
	static canBuildAt(tileX:number, tileY:number, level:Level):boolean {
		return level.atLayer1ByTile(tileX, tileY) == 0x02 || level.atLayer1ByTile(tileX, tileY) == 0x03;
	}
	update(){
		if(this.timer > 0){
			this.timer --;
		} else {
			this.timer = 61;
			if(this.spawnItem(this.miningItem)){
				if(Game.tutorial.miner.firstoutput && Game.persistent.tutorialenabled && this.miningItem == ItemID.base_coalOre){
					_alert("Nice!\nThis is just coal ore though, not coal. Try placing a furnace(4 key).\nOh also, remember you can scroll to zoom in on that beautiful coal ore texture.");
					Game.tutorial.miner.firstoutput = false;
				}
			}
		}
	}
}

const oreFor = {
	0x02: ItemID.base_coalOre,
	0x03: ItemID.base_ironOre
};

function smeltFor(item:Item | string){
	switch(item instanceof Item ? item.id : item){
		case ItemID.base_coalOre: return ItemID.base_coal;
		case ItemID.base_ironOre: return ItemID.base_ironIngot;
	}
	return null;
}

class TrashCan extends Building {
	update(){
		this.grabItem(_ => {return true}, item => {item.deleted = true;}, true);
	}
}


class Furnace extends Building {
	processingItem: Item;
	timer: number;
	constructor(tileX, tileY, id, level){
		super(tileX, tileY, id, level);
		this.timer = 29;
	}
	static canBuildAt(tileX:number, tileY:number, level:Level){
		return level.atLayer1ByTile(tileX, tileY) == 0x01;
	}
	update(){
		if(this.timer > 0 && this.processingItem){
			this.timer --;
		} else if(this.timer <= 0 && this.processingItem){
			if(this.spawnItem(smeltFor(this.processingItem.id))){
				this.timer = 30;
				this.processingItem = null;
			}
		} else if(!this.processingItem){
			this.grabItem(smeltFor, (item) => {
				this.processingItem = item;
			}, true);
		}
	}
}

class Conveyor extends Building {
	item: Item;
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.item = null;
	}
	break(){
		if(this.item instanceof Item && this.item.grabbedBy == this){
			this.item.grabbedBy = null;
		}
		this.item = null;
	}
	update(currentframe){
		if(this.item instanceof Item){
			if(Math.floor(this.item.x / consts.TILE_SIZE) != this.x || Math.floor(this.item.y / consts.TILE_SIZE) != this.y){
				if(this.item.grabbedBy != this || this.item.deleted){
					this.item = null;
				}
				return;
			}
			switch(this.id >> 8){//bit masks ftw, this just grabs the first byte
				//yes I know there's no need to write the ids in hex but why the heck not
				case 0x00:
					this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					this.item.x += consts.buildings.conveyor.SPEED;
					break;
				case 0x01:
					this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					this.item.y += consts.buildings.conveyor.SPEED;
					break;
				case 0x02:
					this.item.x -= consts.buildings.conveyor.SPEED;
					this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					break;
				case 0x03:
					this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					this.item.y -= consts.buildings.conveyor.SPEED;
					break;
				case 0x04:
					if(pixelToTile(this.item.x) >= consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else {
						this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
						this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
					}
					break;
				case 0x05:
					if(pixelToTile(this.item.x) >= consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else {
						this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
						this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
					}
					break;
				case 0x06:
					if(pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelToTile(this.item.x) > consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else {
						this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
						this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
					}
					break;
				case 0x07:
					if(pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else if(pixelToTile(this.item.x) < consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else {
						this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
						this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
					}
					break;
				case 0x08:
					if(pixelToTile(this.item.x) <= consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) >= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else {
						this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
						this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
					}
					break;
				case 0x09:
					if(pixelToTile(this.item.x) <= consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else if(pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y ++;
					} else {
						this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
						this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
					}
					break;
				case 0x0A:
					if(pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelToTile(this.item.x) > consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x --;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else {
						this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
						this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
					}
					break;
				case 0x0B:
					if(pixelToTile(this.item.x) == consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) <= consts.TILE_SIZE * 0.5){
						this.item.x = (Math.floor(this.item.x / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
						this.item.y --;
					} else if(pixelToTile(this.item.x) < consts.TILE_SIZE * 0.5 && pixelToTile(this.item.y) == consts.TILE_SIZE * 0.5){
						this.item.x ++;
						this.item.y = (Math.floor(this.item.y / consts.TILE_SIZE) * consts.TILE_SIZE) + consts.TILE_SIZE/2;
					} else {
						this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
						this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
					}
					break;
			}
		} else {
			this.grabItem(() => {return true;}, (item) => {this.item = item;}, false);
		}
	}
	static canBuildAt(tileX:number, tileY:number, level:Level){
		return level.atLayer1ByTile(tileX, tileY) != 0x04;
	}
}

class Extractor extends Conveyor {
	update(currentFrame){
		if(!this.item){
			if(
				this.id == 0x0005 &&
				this.level.buildingAt(this.x - 1, this.y) instanceof StorageBuilding &&
				(this.level.buildingAt(this.x - 1, this.y) as StorageBuilding).inventory?.length != 0
			){
				this.item = (this.level.buildingAt(this.x - 1, this.y) as StorageBuilding).removeItem();
			} else if(
				this.id == 0x0105 &&
				this.level.buildingAt(this.x, this.y - 1) instanceof StorageBuilding &&
				(this.level.buildingAt(this.x, this.y - 1) as StorageBuilding).inventory?.length != 0
			){
				this.item = (this.level.buildingAt(this.x, this.y - 1) as StorageBuilding).removeItem();
			} else if(
				this.id == 0x0205 &&
				this.level.buildingAt(this.x + 1, this.y) instanceof StorageBuilding &&
				(this.level.buildingAt(this.x + 1, this.y) as StorageBuilding).inventory?.length != 0
			){
				this.item = (this.level.buildingAt(this.x + 1, this.y) as StorageBuilding).removeItem();
			} else if(
				this.id == 0x0305 &&
				this.level.buildingAt(this.x, this.y + 1) instanceof StorageBuilding &&
				(this.level.buildingAt(this.x, this.y + 1) as StorageBuilding).inventory?.length != 0
			){
				this.item = (this.level.buildingAt(this.x, this.y + 1) as StorageBuilding).removeItem();
			} else {
				return super.update(currentFrame);
			}
			this.item.grabbedBy = this;
			this.item.x = (this.x + 0.5) * consts.TILE_SIZE;
			this.item.y = (this.y + 0.5) * consts.TILE_SIZE;
			this.level.items.push(this.item);
		}
		super.update(currentFrame);
	}
}

class StorageBuilding extends Building {
	inventory: any;
	constructor(tileX:number, tileY: number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.inventory = [];
		this.inventory.MAX_LENGTH = 64;
	}
	update(){
		if(this.inventory.length < this.inventory.MAX_LENGTH){
			this.grabItem(() => {return true;}, (item:Item) => {this.inventory.push(item);}, true);
		}
	}
	removeItem():Item {
		if(this.inventory.length > 0){
			return this.inventory.pop();
		} else {
			return null;
		}
	}
}

let alloysFor = {
	"base_coal&base_ironIngot": "base_steelIngot",
	"base_ironIngot&base_coal": "base_steelIngot"
};

class AlloySmelter extends Building {
	timer: number;
	item1: Item;
	item2: Item;
	processing: boolean;
	constructor(tileX:number, tileY:number, id:BuildingID, level:Level){
		super(tileX, tileY, id, level);
		this.timer = 240;
		this.item1 = null;
		this.item2 = null;
		this.processing = false;
	}
	update(){
		if(!this.item1){
			this.grabItem((item) => {return item.id != this.item2?.id;}, (item:Item) => {this.item1 = item;}, true);
		}
		if(!this.item2){
			this.grabItem((item) => {return item.id != this.item1?.id;}, (item:Item) => {this.item2 = item;}, true);
		}
		if(this.item1 instanceof Item && this.item2 instanceof Item){
			if(alloysFor[`${this.item1.id}&${this.item2.id}`]){
				this.processing = true;
			}
		}
		if(this.processing){
			if(this.timer > 0){
				this.timer --;
			} else {
				if(this.spawnItem(alloysFor[`${this.item1.id}&${this.item2.id}`])){
					this.timer = 240;
					this.item1 = null;
					this.item2 = null;
					this.processing = false;
				}
			}
		}
	}
}
