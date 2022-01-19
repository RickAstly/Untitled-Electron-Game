// TODOS
// 
// 
// Add animation to some buildings 👀
// Fix item tooltips on conveyors no longer working
// Fix duplicated displayBuilding code
// Add comments
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 
// 






console.log("%c Hey there! It looks like you're checking out the console.\nIf you want to view the source code, *please do it at* https://github.com/BalaM314/Untitled-Electron-Game \n Make sure to view the .ts files as the .js files are compiled and thus look weird.", "color: blue; font-size: 30px;")

let textures = new Map();
noise.seed(1);

function registerEventHandlers(){

	//Update mouse position
	window.onmousemove = (e:MouseEvent) => {
		mouse.x = e.x;
		mouse.y = e.y;
		mouse.latestEvent = e;
	}

	let clickcapture = document.getElementById("clickcapture");
	clickcapture.onmousedown = (e:MouseEvent) => {
		if(e.button) return e.preventDefault();//right click bad
		mouse.held = true;
		mouse.latestEvent = e;
		canOverwriteBuilding = true;
		if(state[Game.state]){
			state[Game.state]?.onclick?.(e);
		}
	}
	clickcapture.onmouseup = (e:MouseEvent) => {
		mouse.held = false;
		mouse.latestEvent = e;
		canOverwriteBuilding = true;
	}

	//For touch screens
	clickcapture.addEventListener("touchstart", (e:any) => {
		e.x = e.touches[0].clientX;
		e.y = e.touches[0].clientY;
		clickcapture.onmousedown(e);
	});
	clickcapture.addEventListener("touchend", (e:any) => {
		//When the screen is tapped, touchend is fired immediately after touchstart, leaving no time for buildings to be placed.
		//Delays by 500ms
		setTimeout(() => {
			mouse.held = false;
			canOverwriteBuilding = true;
		}, 500);
	});
	clickcapture.addEventListener("touchmove", (e:any) => {
		e.x = e.touches[0].clientX;
		e.y = e.touches[0].clientY;
		window.onmousemove(e);
	});

	clickcapture.oncontextmenu = (e) => {
		//right click bad
		e.preventDefault();
	}

	//Do stuff when a key is pressed(not held).
	window.onkeydown = (e:KeyboardEvent) => {

		//If you pressed a number or function key, draw a box around the building you selected.
		if(typeof parseInt(e.key) == "number"){
			for(let x of document.getElementById("toolbar").children){
				x.classList.remove("selected");
			}
			(document.getElementById("toolbar").children?.[parseInt(e.key) - 1] as HTMLElement)?.classList.add("selected");
		}
		if(parseInt(e.key[1])){
			for(let x of document.getElementById("toolbar").children){
				x.classList.remove("selected");
			}
			(document.getElementById("toolbar").children?.[parseInt(e.key[1]) + 8] as HTMLElement)?.classList.add("selected");
		}

		//Push key to keysPressed
		if(keysHeld.indexOf(e.key.toLowerCase()) == -1){
			keysHeld.push(e.key.toLowerCase());
		}

		//Switch case for all key events that need to be handled.
		if(e.ctrlKey){
			switch(e.key){
				case "s":
					exportData(); e.preventDefault(); break;
				case "o":
					uploadButton.click(); e.preventDefault(); break;
			}
		} else {
			switch(e.key){
				case "ArrowRight":
					placedBuilding.direction = 0x000; break;
				case "ArrowDown":
					placedBuilding.direction = 0x100; break;
				case "ArrowLeft":
					placedBuilding.direction = 0x200; break;
				case "ArrowUp":
					placedBuilding.direction = 0x300; break;
				case ",":
					placedBuilding.modifier = 0x000; break;
				case ".":
					placedBuilding.modifier = 0x400; break;
				case "/":
					placedBuilding.modifier = 0x800; e.preventDefault(); break;
				case "1":
					placedBuilding.type = 0x0001; break;
				case "2":
					placedBuilding.type = 0x0002; break;
				case "3":
					placedBuilding.type = 0x0003; break;
				case "4":
					placedBuilding.type = 0x0004; break;
				case "5":
					placedBuilding.type = 0x0005; break;
				case "6":
					placedBuilding.type = 0x0006; break;
				case "7":
					placedBuilding.type = 0x0007; break;
				case "8":
					placedBuilding.type = 0x0009; break;
				case "9":
					placedBuilding.type = 0x000A; break;
				case "F1":
					placedBuilding.type = 0x000B; e.preventDefault(); break;
				case "F2":
					placedBuilding.type = 0x0011; e.preventDefault(); break;
				case "0":
					placedBuilding.type = 0xFF; break;
			}
		}

	}
	window.onkeyup = (e:KeyboardEvent) => {
		//Remove key from list of held keys
		if(keysHeld.contains(e.key.toLowerCase())){
			keysHeld.splice(keysHeld.indexOf(e.key.toLowerCase()), 1);
		}
	}
	


	uploadButton.onchange = function(event:any){
		//Load a save file
		let file = event.target.files[0];
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function(readerEvent){
			let content = readerEvent.target.result.toString();
			importData(content);
		}
	}

	window.onwheel = (e:WheelEvent) => {
		zoom(Math.pow(1.001, -e.deltaY));
	}

	//When the window loses focus, clear the list of held keys and set mousePressed to false.
	window.onblur = () => {
		keysHeld = [];
		mouse.held = false;
		//call pause here once I add it
	}

}







let fps = [0, 0, 0, 0, 0, 0];
let state: {
	[index: string]: {
		update: Function,
		display: Function,
		onclick?: Function,
		onmouseheld?: Function,
		onkeyheld?: Function
	}
} = {
	title: {
		update: function(){},
		display: function(currentFrame:currentFrame){
			ctx.clearRect(-1, -1, 10000, 10000);
			ctx.fillStyle = "#0033CC";
			ctx.fillRect(0, 0, innerWidth, innerHeight);
			ctx.font = "70px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000000";
			ctx.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			ctx.font = "20px sans-serif";
			ctx.fillText("Title Screen Soon™", innerWidth / 2, innerHeight * 0.35);
			ctx.fillStyle = "#0000FF";
			rect(innerWidth/4, innerHeight * 0.5, innerWidth/2, innerHeight * 0.2, rectMode.CORNER);
			rect(innerWidth/4, innerHeight * 0.75, innerWidth/2, innerHeight * 0.2, rectMode.CORNER);
			ctx.strokeStyle = "#000000";
			ctx.lineWidth = 2;
			ctx.strokeRect(innerWidth/4, innerHeight * 0.5, innerWidth/2, innerHeight * 0.2);
			ctx.strokeRect(innerWidth/4, innerHeight * 0.75, innerWidth/2, innerHeight * 0.2);
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "40px sans-serif";
			ctx.fillText("Play", innerWidth/2, innerHeight * 0.6);
			ctx.fillText("Settings", innerWidth/2, innerHeight * 0.85);
		},
		onclick: function(e:MouseEvent){
			if(e.x > innerWidth / 4 && e.x < innerWidth * 0.75){
				if(e.y > innerHeight / 2 && e.y < innerHeight * 0.7){
					mouse.held = false;
					preload();
				}
				if(e.y > innerHeight * 0.75 && e.y < innerHeight * 0.95){
					Game.state = "settings";
				}
			}
		}
	},
	settings: {
		update: function(){},
		display: function(currentFrame:currentFrame){
			ctx.clearRect(-1, -1, 10000, 10000);
			ctx.fillStyle = "#0033CC";
			ctx.fillRect(0, 0, innerWidth, innerHeight);
			ctx.font = "70px sans-serif";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = "#000000";
			ctx.fillText("Settings", innerWidth / 2, innerHeight * 0.2);
			ctx.strokeStyle = "#000000";
			ctx.strokeRect(innerWidth * 0.9, innerHeight * 0.01, innerWidth * 0.09, innerHeight * 0.09);
			ctx.fillStyle = "#FF0000";
			ctx.font = "50px sans-serif";
			ctx.fillText("❌",innerWidth * 0.945, innerHeight * 0.055);
			ctx.strokeRect(innerWidth * 0.25, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2);
			ctx.strokeRect(innerWidth * 0.51, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2);
			ctx.fillStyle = "#0000FF";
			rect(innerWidth * 0.25, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2, rectMode.CORNER);
			rect(innerWidth * 0.51, innerHeight * 0.5, innerWidth * 0.25, innerHeight * 0.2, rectMode.CORNER);
			ctx.fillStyle = "#FFFFFF";
			ctx.fillText("Tutorial: " + Game.persistent.tutorialenabled, innerWidth * 0.375, innerHeight * 0.6);
			ctx.fillText("Debug: " + settings.debug, innerWidth * 0.625, innerHeight * 0.6);
		},
		onclick: function(e:MouseEvent){
			if(e.y < innerHeight * 0.1 && e.y > innerHeight * 0.01 && e.x > innerWidth * 0.9 && e.x < innerWidth * 0.99){
				localStorage.setItem("persistentStorage", JSON.stringify(Game.persistent));
				Game.state = "title";
			}
			if(e.y > innerHeight * 0.5 && e.y < innerHeight * 0.7 && e.x > innerWidth * 0.25 && e.x < innerWidth * 0.51){
				Game.persistent.tutorialenabled = !Game.persistent.tutorialenabled;
				mouse.held = false;
			}
			if(e.y > innerHeight * 0.5 && e.y < innerHeight * 0.7 && e.x > innerWidth * 0.51 && e.x < innerWidth * 0.76){
				settings.debug = !settings.debug;
				mouse.held = false;
			}
		}
	},
	game: {
		update: function(currentFrame:any, level:Level){
			level ??= level1;
			level.generateNecessaryChunks();
			try {
				level.update(currentFrame);
			} catch(err){
				console.error(err);
				throw new Error(`Error updating world: ${err.message}`);
			}			
		},
		display: function(currentFrame:any, level:Level){
			level ??= level1;
			//display
			if(currentFrame.redraw){
				ctx.clearRect(0, 0, innerWidth, innerHeight);
			}
			ctx1.clearRect(0, 0, innerWidth, innerHeight);
			ctx2.clearRect(0, 0, innerWidth, innerHeight);
			ctx25.clearRect(0, 0, innerWidth, innerHeight);
			ctx3.clearRect(0, 0, innerWidth, innerHeight);
			ctx4.clearRect(0, 0, innerWidth, innerHeight);
		
			level.display(currentFrame);
		
			
			level.displayGhostBuilding((mouse.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, (mouse.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE, placedBuilding.ID);
			if(keysHeld.indexOf("shift") != -1){
				level.displayTooltip(mouse.x, mouse.y, currentFrame);
			}
			
			//display overlays
			ctx4.font = "30px sans-serif";
			ctx4.fillStyle = "#000000";
			ctx4.fillText((Math.round(- (Game.scroll.x * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString() + ", " + Math.round(- (Game.scroll.y * consts.DISPLAY_SCALE) / consts.DISPLAY_TILE_SIZE).toString()), 10, 100);
			// let frameMS = (new Date()).getTime() - startFrameTime.getTime();
			// fps.splice(0, 1);
			// fps.push(frameMS);
			// let avgFPS = Math.round(constrain(5000/(fps[0] + fps[1] + fps[2] + fps[3] + fps[4]), 0, 60));
			// ctx4.fillText(avgFPS + " fps", 10, 50); TODO RE ENABLE
			if(settings.debug){
				ctx4.fillText("C: " + currentFrame.cps, 10, 150);
				ctx4.fillText("I: " + currentFrame.ips, 10, 200);
			}
		
			for(let item of (<HTMLDivElement>document.getElementById("resources")!).children){
				item.innerHTML = (level1.resources[item.id] ?? 0).toString();
			}
		},
		onclick: function(e:MouseEvent){
			if(e.ctrlKey){
				level1.addItem((e.x - (Game.scroll.x * consts.DISPLAY_SCALE))/consts.DISPLAY_SCALE, (e.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_SCALE, ItemID.base_null);
			}
		},
		onmouseheld: function(){
			let e = mouse.latestEvent;
			if(!keysHeld.includes("control")){
				level1.buildBuilding(Math.floor((e.x - (Game.scroll.x * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), Math.floor((e.y - (Game.scroll.y * consts.DISPLAY_SCALE)) / consts.DISPLAY_TILE_SIZE), placedBuilding.ID);
			}
		},
		onkeyheld: function(currentframe:currentFrame){
			if(keysHeld.indexOf("w") != -1){
				Game.scroll.y += Game.scroll.speed;
				currentframe.redraw = true;
			}
			if(keysHeld.indexOf("a") != -1){
				Game.scroll.x += Game.scroll.speed;
				currentframe.redraw = true;
			}
			if(keysHeld.indexOf("s") != -1){
				Game.scroll.y -= Game.scroll.speed;
				currentframe.redraw = true;
			}
			if(keysHeld.indexOf("d") != -1){
				Game.scroll.x -= Game.scroll.speed;
				currentframe.redraw = true;
			}
		}
	}
};


//Unlike the onkeydown function, this one needs to run based on keys being held.

function fixSizes(){
	for(let x of ctxs){
		if(x.canvas.width != window.innerWidth){
			x.canvas.width = window.innerWidth;
			Game.forceRedraw = true;
		}
		if(x.canvas.height != window.innerHeight){
			x.canvas.height = window.innerHeight;
			Game.forceRedraw = true;
		}
	}
}

function handleAlerts(){
	if(alerts.length){
		mouse.held = false;
		for(let __alert of alerts){
			if(__alert instanceof Array){
				setTimeout(() => {
					_alert(__alert[0]);
				}, __alert[1]);
			} else {
				alert(__alert);//todo replace with a less annoying custom alert box
			}
		}
		alerts = [];
	}
}



let cancel = null;
function main_loop(){
	try {
		let currentFrame:currentFrame = {
			tooltip: true,
			debug: settings.debug,
			cps: 0,
			tps: 0,
			ips: 0,
			redraw: Game.forceRedraw
		};
		Game.forceRedraw = false;
		fixSizes();
		if(keysHeld.indexOf("shift") !== -1){
			Game.scroll.speed = 20;
		} else {
			Game.scroll.speed = 5;
		}
		
		let currentState = state[Game.state];
		if(!currentState){
			throw new InvalidStateError(`Invalid game state "${Game.state}"`);
		}

		if(mouse.held){
			currentState.onmouseheld?.(currentFrame);
		}
		if(keysHeld.length != 0){
			currentState.onkeyheld?.(currentFrame);
		}

		currentState.update(currentFrame);
		currentState.display(currentFrame);
		
		handleAlerts();

	} catch(err){
		alert("An error has occurred! Oopsie.\nPlease create an issue on this project's GitHub so I can fix it.\nErr: " + err.message);//todo improve
		ctxs.forEach((ctx) => {ctx.clearRect(0,0,innerWidth,innerHeight)});
		throw err;
	}
	cancel = requestAnimationFrame(main_loop);
}


function preload(){
	
	if(loadedtextures == document.getElementById("textures").children.length){
		loadTextures();
		load();
	} else if(loadedtextures > document.getElementById("textures").children.length){
		throw new ShouldNotBePossibleError("somehow loaded more textures than exist, what the fffffff");
	} else {
		alert("Not all textures have loaded!\nYou may have a slow internet connection, or the game may just be broken.\nClick OK to try again.");
		setTimeout(preload, 1);
		return;
	}
}

function load(){
	level1 = new Level(314);
	level1.generateNecessaryChunks();
	level1.buildBuilding(0,0,0x0008);
	level1.buildBuilding(0,-1,0x0008);
	level1.buildBuilding(-1,0,0x0008);
	level1.buildBuilding(-1,-1,0x0008);

	Game.state = "game";
	Game.forceRedraw = true;
	document.getElementById("toolbar").classList.remove("hidden");
	document.getElementById("resources").classList.remove("hidden");

	if(Game.persistent.tutorialenabled){
		setTimeout(() => {
			alert(`
Welcome to Untitled Electron Game!
This is a game about... well I don't really know, but it has items, conveyor belts, and machines. Guess you could call it a factory game?

For now there's no real goal, but I suggest you automate iron and coal production.
To get started, place a conveyor belt.

Basic controls:
Click to place a building.
Use the number keys to choose the type of building.
Press 0 to "place air"(delete buildings).
Use WASD to move around the map and mouse wheel to zoom.
Press Shift to move faster and for tooltips.`
			);
		}, 500);
	}
}

let loadedtextures = 0;

let level1:Level;

for(let element of document.getElementById("textures").children){
	element.addEventListener("load", () => {//TODO: this is probably the reason texture loading is funny sometimes. Move to pre oage load or inline.
		loadedtextures ++;
	});
	element.addEventListener("error", (err) => {
		alert("Failed to load texture " + (err.target as HTMLImageElement).src.split("assets/textures/")[1]);
		throw err;
	});
}

for(let element of document.getElementById("toolbar").children){
	//Also move this to inline
	element.addEventListener("click", (event:MouseEvent) => {
		for(let x of document.getElementById("toolbar").children){
			x.classList.remove("selected");
		}
		(event.target as HTMLElement).classList.add("selected");
		placedBuilding.type = <RawBuildingID>parseInt((event.target as HTMLElement).id);
		mouse.held = false;
	});
}



function exportData(){
	let output = {
		UntitledElectronGame: {
			metadata: {
				validationCode: "esrdtfgvczdsret56u7yhgvfcesrythgvfd!",
				version: consts.VERSION
			},
			level1: level1.export()
		}
	};

	download("Untitled-Electron-Game-save.json", JSON.stringify(output));
}

function importData(rawData:string){
	let tempLevel:Level;
	try {
		let data = JSON.parse(rawData);
		assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
		
		let levelData = data.UntitledElectronGame.level1;
		levelData.version = data.UntitledElectronGame.metadata.version;
		assert(levelData.chunks instanceof Object);
		assert(levelData.items instanceof Array);



		tempLevel = new Level(levelData);
		level1 = tempLevel;

	} catch(err){
		console.error("Import failed.", err);
		alert("Import failed! " + err.message);
	}
}


let placedBuilding: {
	type: RawBuildingID
	direction: 0x000 | 0x100 | 0x200 | 0x300;
	ID: BuildingID;
	modifier: 0x000 | 0x400 | 0x800
} = {
	type: 0x0001,
	direction: 0x100,
	modifier: 0x000,
	get ID(){
		if(this.type == 0x05){
			return this.type + this.direction + this.modifier;
		} else if(this.type == 0x01){
			return this.type + this.direction;
		} else if(this.type == 0xFF){
			return 0xFFFF;
		} else {
			return this.type;
		}
	}
};
let canOverwriteBuilding = true;



try {
	assert(localStorage.getItem("persistentStorage"));
	Game.persistent = JSON.parse(localStorage.getItem("persistentStorage"));
} catch(err){
	console.warn("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
	localStorage.setItem("persistentStorage", "{\"tutorialenabled\": false}");
}

registerEventHandlers();

main_loop();