
/**Registers event handlers, called once on page load. */
function registerEventHandlers(){

	//Update mouse position
	window.onmousemove = (e:MouseEvent) => {
		Input.mouseX = e.x;
		Input.mouseY = e.y;
		Input.latestMouseEvent = e;
	}

	clickcapture.onmousedown = (e:MouseEvent) => {
		//The default action is to bring up a context menu or the scroller thing, not desirable
		if(e.button) e.preventDefault();
		if(e.button == 0){
			Input.mouseDown = true;
		}
		Input.latestMouseEvent = e;
		canOverwriteBuilding = true;
		if(state[Game.state]){
			state[Game.state]?.onmousedown?.(e);
		}
	}
	clickcapture.onmouseup = (e:MouseEvent) => {
		if(e.button == 0){
			Input.mouseDown = false;
		}
		Input.latestMouseEvent = e;
		canOverwriteBuilding = true;
	}

	//For touch screens
	clickcapture.addEventListener("touchstart", (e:any) => {
		e.x = e.touches[0].clientX;
		e.y = e.touches[0].clientY;
		clickcapture.onmousedown?.(e);
	});
	clickcapture.addEventListener("touchend", (e:any) => {
		//When the screen is tapped, touchend is fired immediately after touchstart, leaving no time for buildings to be placed.
		//Delays by 500ms
		setTimeout(() => {
			Input.mouseDown = false;
			canOverwriteBuilding = true;
		}, 500);
	});
	clickcapture.addEventListener("touchmove", (e:any) => {
		e.x = e.touches[0].clientX;
		e.y = e.touches[0].clientY;
		window.onmousemove?.(e);
	});

	clickcapture.oncontextmenu = (e) => {
		//Prevent the menu from showing
		e.preventDefault();
	}

	//Do stuff when a key is pressed(not held).
	window.onkeydown = (e:KeyboardEvent) => {

		if(e.ctrlKey && (e.key.match(/^[wK]$/) || e.key.match(/^[ertuni1-9]$/i)) || e.key.match(/^f[5]$/i) ){
			return;
			//If you pressed one of these key combos, return
		}
		e.preventDefault();

		//Add key to keysHeld
		Input.keysHeld.add(e.key.toLowerCase());

		//Push key to lastKeysPressed
		Input.lastKeysPressed.push(e.key);
		Input.lastKeysPressed.shift();
		//Only the last 10 keypresses are logged

		//Handle keybinds
		for(let section of Object.values(keybinds)){
			for(let keybind of Object.values(section)){
				keybind.check(e);
			}
		}

		if(state[Game.state]){
			state[Game.state]?.onkeydown?.(e);
		}

		//Otherwise prevent default

	}
	window.onkeyup = (e:KeyboardEvent) => {
		//Remove key from list of held keys
		Input.keysHeld.delete(e.key.toLowerCase());
	}
	

	//When file uploaded
	uploadButton.onchange = (event:Event) => {
		//Load a save file
		let file = ((event.target as any)?.files?.[0] ?? null) as Blob | null;
		if(file == null) return;
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onload = e => {
			let content = e.target?.result?.toString();
			if(content == null) return;
			importData(content);
		}
	}

	window.onwheel = (e:WheelEvent) => {
		Camera.zoom(Math.pow(1.001, -e.deltaY));
	}

	//When the window loses focus, clear the list of held keys and set mousePressed to false.
	window.onblur = () => {
		Input.keysHeld.clear();
		Input.mouseDown = false;
		//call pause here once I add it
	}

	window.onbeforeunload = (e:BeforeUnloadEvent) => {
		//Page is about to close
		if(Game.state != "game"){
			return;
			//If you aren't in-game, just exit
		}

		if(!localStorage.getItem("save1") || JSON.parse(localStorage.getItem("save1")!)?.metadata?.uuid == level1?.uuid){
			//If there's nothing in save1 or the uuid of save1 and the current level are the same, save
			localStorage.setItem("save1", JSON.stringify(exportData()));
		} else {
			//Try to cancel page close
			e.preventDefault();
			e.returnValue = "";
			localStorage.setItem("save-recovered", JSON.stringify(exportData()));
			setTimeout(() => {
				if(confirm("Could not save automatically on page exit because your current world is unrelated to your saved world.\nWould you like to save anyway? This will overwrite your current save!")){
					localStorage.setItem('save1', JSON.stringify(exportData()));
					localStorage.removeItem("save-recovered");
				} else {
					alert("Sorry there aren't any save slots yet.");
				}
			}, 1);
		}
	}

	for(let element of toolbarEl.children){
		element.addEventListener("click", (event) => {
			if(event.target instanceof HTMLImageElement){
				for(let x of toolbarEl.children){
					x.classList.remove("selected");
				}
				event.target.classList.add("selected");
				placedBuilding.type = (event.target as HTMLImageElement).id as RawBuildingID;
				Input.mouseDown = false;
			}
		});
	}

	alertexit.onclick = closeAlert;
}






//todo fix this VV probably repeating myself a lot
/**Holds all the function that do things in each game state. */
let state: {
	[P in typeof Game.state]: {
		buttons: Button[],
		update: (currentFrame:CurrentFrame) => void;
		display: (currentFrame:CurrentFrame) => void;
		onmousedown?: (e:MouseEvent) => void;
		onmouseheld?: (currentFrame:CurrentFrame) => void;
		onkeydown?: (e:KeyboardEvent) => void;
		onkeyheld?: (currentFrame:CurrentFrame) => void;
	}
} = {
	loading: {
		buttons: [],
		update(){
			if(Game.texturesReady) Game.state = "title";
		},
		display(currentFrame:CurrentFrame){
			ctxOverlays.clear();
			ctxOverlays.fillStyle = "#0033CC";
			ctxOverlays.fillRect(0, 0, innerWidth, innerHeight);
			ctxOverlays.font = "70px sans-serif";
			ctxOverlays.textAlign = "center";
			ctxOverlays.textBaseline = "middle";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.font = `40px sans-serif`;
			ctxOverlays.fillText(`Loading... ${Game.loadedTextures}/${textureIDs.length}`, innerWidth / 2, innerHeight * 0.35);
		}
	},
	title: {
		buttons: [
			new Button({
				x: () => innerWidth/4,
				y: () => innerHeight/2,
				width: () => innerWidth/2,
				height: () => innerHeight/5,
				label: "Play",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Input.mouseDown = false;load();}
			}),
			new Button({
				x: () => innerWidth/4,
				y: () => innerHeight * 0.75,
				width: () => innerWidth/2,
				height: () => innerHeight/5,
				label: "Settings",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.state = "settings";}
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.05,
				height: () => innerHeight * 0.05,
				label: "Help",
				color: "#0000FF",
				font: "30px sans-serif",
				onClick: () => {window.open("https://github.com/BalaM314/Untitled-Electron-Game/wiki/Quickstart-Guide");}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			ctxOverlays.clear();
			ctxOverlays.fillStyle = "#0033CC";
			ctxOverlays.fillRect(0, 0, innerWidth, innerHeight);
			ctxOverlays.font = "70px sans-serif";
			ctxOverlays.textAlign = "center";
			ctxOverlays.textBaseline = "middle";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.fillText("Untitled Electron Game", innerWidth / 2, innerHeight * 0.2);
			ctxOverlays.fillStyle = "#cccc00";
			ctxOverlays.font = `${20 + 5*Game.splash.bounceFunc(millis() / 400)}px sans-serif`;
			ctxOverlays.fillText(Game.splash.text ?? "splash not found! this is actually an error pls report", innerWidth / 2, innerHeight * 0.35);
			state.title.buttons.forEach(button => button.display(ctxOverlays));
		},
		onmousedown(e:MouseEvent){
			state.title.buttons.forEach(button => button.handleMouseClick(e));
			if(Intersector.pointInRect(Input.mouse, [innerWidth * 0.4, innerHeight * 0.3, innerWidth * 0.2, innerHeight * 0.1]))
				Game.splash.clickBehavior();
		}
	},
	settings: {
		buttons: [
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Debug: " + settings.debug,
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {settings.debug = !settings.debug;}
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.66,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Always load save: " + settings.alwaysLoadSave,
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {settings.alwaysLoadSave = !settings.alwaysLoadSave;}
			}),
			new Button({
				x: () => innerWidth * 0.51,
				y: () => innerHeight * 0.66,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: () => "Autosave: " + settings.autoSave,
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {settings.autoSave = !settings.autoSave;}
			}),
			new Button({
				x: () => innerWidth * 0.25,
				y: () => innerHeight * 0.5,
				width: () => innerWidth * 0.25,
				height: () => innerHeight * 0.15,
				label: "Controls",
				color: "#0000FF",
				font: "35px sans-serif",
				onClick: () => {Game.state = "settings.keybinds"}
			}),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.state = "title"; localStorage.setItem("settings", JSON.stringify(settings));}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			ctxOverlays.clear();
			ctxOverlays.fillStyle = "#0033CC";
			ctxOverlays.fillRect(0, 0, innerWidth, innerHeight);
			ctxOverlays.font = "70px sans-serif";
			ctxOverlays.textAlign = "center";
			ctxOverlays.textBaseline = "middle";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.fillText("Settings", innerWidth / 2, innerHeight * 0.2);
			state.settings.buttons.forEach(button => button.display(ctxOverlays));
		},
		onmousedown(e:MouseEvent){
			state.settings.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	"settings.keybinds": {
		buttons: [
			makeRebindButton(0.3, ["move", "up"], "Move up", "w"),
			makeRebindButton(0.35, ["move", "left"], "Move left", "a"),
			makeRebindButton(0.4, ["move", "down"], "Move down", "s"),
			makeRebindButton(0.45, ["move", "right"], "Move right", "d"),
			makeRebindButton(0.5, ["move", "scroll_faster"], "Scroll faster", "shift"),
			makeRebindButton(0.55, ["saves", "save_to_file"], "Save to file", "s"),
			makeRebindButton(0.6, ["saves", "save"], "Save to browser", "s"),
			makeRebindButton(0.65, ["saves", "load_from_file"], "Load from file", "o"),
			makeRebindButton(0.7, ["placement", "break_building"], "Break building", "backspace"),
			makeRebindButton(0.75, ["placement", "force_straight_conveyor"], "Force straight conveyor", "shift"),
			makeRebindButton(0.8, ["display", "show_tooltip"], "Show tooltips", "shift"),
			new Button({
				x: () => innerWidth * 0.9,
				y: () => innerHeight * 0.01,
				width: () => innerWidth * 0.09,
				height: () => innerHeight * 0.09,
				label: "❌",
				color: "#0000FF",
				font: "40px sans-serif",
				onClick: () => {Game.state = "settings";}
			}),
		],
		update(){},
		display(currentFrame:CurrentFrame){
			ctxOverlays.clear();
			ctxOverlays.fillStyle = "#0033CC";
			ctxOverlays.fillRect(0, 0, innerWidth, innerHeight);
			ctxOverlays.font = "60px sans-serif";
			ctxOverlays.textAlign = "center";
			ctxOverlays.textBaseline = "middle";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.fillText("Keybinds", innerWidth / 2, innerHeight * 0.2);
			this.buttons.forEach(button => button.display(ctxOverlays));
		},
		onmousedown(e:MouseEvent){
			this.buttons.forEach(button => button.handleMouseClick(e));
		}
	},
	game: {
		buttons: [],
		update(currentFrame:CurrentFrame){
			if(Game.paused) return;
			level1.generateNecessaryChunks();
			try {
				level1.update(currentFrame);
			} catch(err){
				console.error(err);
				throw new Error(`Error updating world: ${parseError(err)}`);
			}			
		},
		display(currentFrame:CurrentFrame){
			//display

			if(Game.paused){
				ctxOverlays.font = "48px sans-serif";
				ctxOverlays.fillStyle = "#3333CC";
				ctxOverlays.textAlign = "center";
				ctxOverlays.fillText("Game paused", innerWidth * 0.5, innerHeight * 0.2);
				ctxOverlays.font = "24px sans-serif";
				ctxOverlays.fillText("Press esc to unpause", innerWidth * 0.5, innerHeight * 0.25);
				Game.forceRedraw = true;
				return;
			}

			if(currentFrame.redraw){
				ctxTiles.clear();
			}
			ctxGBuilds.clear();
			ctxBuilds.clear();
			ctxOBuilds.clear();
			ctxItems.clear();
			ctxOverlays.clear();
		
			level1.display(currentFrame);
		
			
			level1.displayGhostBuilding(
				...(Camera.unproject(Input.mouseX, Input.mouseY).map(Pos.pixelToTile) as [number, number]),
				placedBuilding.ID, currentFrame
			);
			if(keybinds.display.show_tooltip.isHeld()){
				level1.displayTooltip(Input.mouseX, Input.mouseY, currentFrame);
			}
			
			//display overlays
			ctxOverlays.font = "30px sans-serif";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.textAlign = "left";
			ctxOverlays.fillText(
				Camera.unproject(Input.mouseX, Input.mouseY).map(Pos.pixelToTile).join(","),
				10, 100
			);
			
			if(settings.debug){
				ctxOverlays.fillText("C: " + currentFrame.cps, 10, 150);
				ctxOverlays.fillText("I: " + currentFrame.ips, 10, 200);
			}
		
			for(let item of (resourcesEl).children){
				(item as HTMLSpanElement).innerText = (level1.resources[item.id] ?? 0).toString();
			}
		},
		onmousedown(e:MouseEvent){
			if(Game.paused) return;
			if(e.ctrlKey && e.button == 0){
				level1.buildingAtPixel(
					...(Camera.unproject(e.x, e.y))
				)?.acceptItem(new Item(
					...(Camera.unproject(e.x, e.y).map(c => Pos.tileToPixel(Pos.pixelToTile(c), true)) as [number, number]),
					"base_null"
				), null);
			}
		},
		onmouseheld(){
			if(Game.paused) return;
			if(!Input.latestMouseEvent) return;
			if(!(Input.keysHeld.has("control") || keybinds.placement.break_building.isHeld()) && placedBuilding.ID[0] != "base_null"){
				level1.buildBuilding(
					...(Camera.unproject(Input.latestMouseEvent.x, Input.latestMouseEvent.y).map(Pos.pixelToTile) as [number, number]),
					placedBuilding.ID
				);
			}
		},
		//Unlike the onkeydown function, this one needs to run based on keys being held.
		onkeyheld(currentframe:CurrentFrame){
			const scrollSpeed = keybinds.move.scroll_faster.isHeld() ? consts.fastScrollSpeed : consts.scrollSpeed;
			if(keybinds.move.up.isHeld()){
				Camera.scrollY += scrollSpeed;
				currentframe.redraw = true;
			}
			if(keybinds.move.left.isHeld()){
				Camera.scrollX += scrollSpeed;
				currentframe.redraw = true;
			}
			if(keybinds.move.down.isHeld()){
				Camera.scrollY -= scrollSpeed;
				currentframe.redraw = true;
			}
			if(keybinds.move.right.isHeld()){
				Camera.scrollX -= scrollSpeed;
				currentframe.redraw = true;
			}
			if(keybinds.placement.break_building.isHeld()){
				currentframe.redraw = true;
				level1.breakBuilding(
					...(Camera.unproject(Input.mouseX, Input.mouseY).map(Pos.pixelToTile) as [number, number])
				);
			}
		},
		onkeydown(e){
			//If you pressed a number or function key, draw a box around the building you selected.
			if(!isNaN(parseInt(e.key))){
				for(let x of toolbarEl.children){
					x.classList.remove("selected");
				}
				(toolbarEl.children[parseInt(e.key) - 1] as HTMLElement)?.classList.add("selected");
			}
			if(!isNaN(parseInt(e.key[1]))){
				for(let x of toolbarEl.children){
					x.classList.remove("selected");
				}
				(toolbarEl.children[parseInt(e.key[1]) + 8] as HTMLElement)?.classList.add("selected");
			}

			//Easter egg
			if(e.key == "Enter" && Input.lastKeysPressed.join(", ") == 
				["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a", "Enter"].join(", ")
				){
				window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
				for(let [key, value] of Object.entries(level1.resources)){
					level1.resources[key] = Infinity;
				}
			}
		}
	}
};


/**Sets the canvas sizes to the window size. */
function fixSizes(){
	//This has to be done dynamically because for some reason setting a canvas to width:100% height:100% makes it glitch out.
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
	if(Game.alerts.list.length && !Game.alerts.active){
		Input.mouseDown = false;
		alertmessage.innerHTML = Game.alerts.list.shift()!;
		alertmessage.style.setProperty("--text-length", alertmessage.innerText.length.toString());
		alertbox.classList.add("active");
		Game.alerts.active = true;
	}
}



/**The main loop! Called once per frame. */
function main_loop(){
	try {
		let startFrameTime = Date.now();
		let currentFrame:CurrentFrame = {
			tooltip: true,
			debug: settings.debug,
			cps: 0,
			tps: 0,
			ips: 0,
			redraw: Game.forceRedraw,
			frame: Game.frames
		};
		Game.forceRedraw = false;
		fixSizes();
		window.getSelection()?.empty();
		
		let currentState = state[Game.state];
		if(!currentState){
			throw new InvalidStateError(`Invalid game state "${Game.state}"`);
		}

		if(Input.mouseDown){
			currentState.onmouseheld?.(currentFrame);
		}
		if(Input.keysHeld.size > 0){
			currentState.onkeyheld?.(currentFrame);
		}

		currentState.update(currentFrame);
		currentState.display(currentFrame);
		
		if(Game.state == "game"){
			let frameMS = Date.now() - startFrameTime;
			Game.stats.frameTimes.add(frameMS);
			const frameMSLast10 = Game.stats.frameTimes.mean(10, null);
			const frameMSLast120 = Game.stats.frameTimes.mean(120, null);
			//TODO repeated code
			const fpsLast10 = frameMSLast10 ? Math.min(consts.ups, round(1000 / frameMSLast10, 1)) : "...";
			const fpsLast120 = frameMSLast120 ? Math.min(consts.ups, round(1000 / frameMSLast120, 1)) : "...";
			ctxOverlays.fillStyle = "#000000";
			ctxOverlays.font = "30px sans-serif";
			ctxOverlays.textAlign = "left";
			ctxOverlays.fillText(`FPS: ${fpsLast10}/${fpsLast120}`, 10, 50);
		}

		handleAlerts();
		Game.frames ++;

	} catch(err){
		alert("An error has occurred! Oopsie.\nPlease create an issue on this project's GitHub so I can fix it.\nError message: " + parseError(err));
		ctxs.forEach((ctx) => {ctx.clear();});
		throw err;
	}
	Game.animationFrame = requestAnimationFrame(main_loop);
}

/**Called when switching to gamestate "game". */
function load(){
	
	
	
	if(!localStorage.firstload){
		localStorage.firstload = true;
		_alert(`Welcome to Untitled Electron Game!
		This is a game about building a factory. It's still in early alpha, so there's not much content.
		There's no good in game tutorial, so to get started check the <a href="https://github.com/BalaM314/Untitled-Electron-Game/wiki/Quickstart-Guide">wiki page</a>.`);
	}
	
	if(
	localStorage.getItem("save1") &&
	(settings.alwaysLoadSave || confirm("Would you like to load your save?"))
	){
		importData(localStorage.getItem("save1")!);
	} else {
		level1 = new Level(314).generate();
	}

	Game.state = "game";
	Game.forceRedraw = true;
	toolbarEl.classList.remove("hidden");
	resourcesEl.classList.remove("hidden");

	if(settings.autoSave){
		if(
			!localStorage.getItem("save1") ||
			((JSON.parse(localStorage.getItem("save1")!) as SaveData).UntitledElectronGame?.level1?.uuid == level1?.uuid)
		){
			setInterval(() => {
				localStorage.setItem("save1", JSON.stringify(exportData()));
				console.log("Autosaved.");
				Game.lastSaved = millis();
			}, 30000);
		} else {
			_alert("It looks like your current world isn't the same world as your save. Autosaving has been disabled to avoid overwriting it.");
		}
	}
}




/**Exports an Untitled Electron Game save, as an object. */
function exportData():SaveData {
	return {
		UntitledElectronGame: {
			metadata: {
				validationCode: "esrdtfgvczdsret56u7yhgvfcesrythgvfd!",
				id: level1?.uuid ?? Math.random().toString().substring(2),
				version: consts.VERSION,
				timeCreated: new Date().getTime().toString()
			},
			level1: level1.export()
		}
	};
}

/**Imports an Untitled Electron Game save. */
function importData(rawData:string){
	let tempLevel:Level;
	try {
		let data:SaveData = JSON.parse(rawData);
		assert(data.UntitledElectronGame.metadata.validationCode === "esrdtfgvczdsret56u7yhgvfcesrythgvfd!");
		
		let levelData = data.UntitledElectronGame.level1;
		levelData.version = data.UntitledElectronGame.metadata.version;
		assert(levelData.chunks instanceof Object);



		tempLevel = Level.read(levelData);
		level1 = tempLevel;

	} catch(err){
		console.error("Import failed.", err);
		alert("Import failed! " + parseError(err));
	}
}

function attemptManualLocalSave(){
	if(
		(!localStorage.getItem("save1") 
			|| (JSON.parse(localStorage.getItem("save1")!) as SaveData).UntitledElectronGame?.level1?.uuid == level1?.uuid)
		|| confirm("Are you sure you want to save? This will overwrite your current saved world which seems to be different!")
	){
		try {
			localStorage.setItem("save1", JSON.stringify(exportData()));
			alert("Saved successfully!");
			Game.lastSaved = millis();
		} catch(err){
			alert("Failed to save! " + parseError(err));
		}
	}
}

/**An object to store the type, direction, and modifier of placed buildings. */
let placedBuilding: {
	type: RawBuildingID
	direction: Direction;
	ID: BuildingIDWithMeta;
	modifier: 0 | 1 | 2;
} = {
	type: "base_null",
	direction: Direction.right,
	modifier: 0,
	get ID():BuildingIDWithMeta {
		if(this.type == "base_null") return ["base_null", 0];
		return Buildings.get(this.type).getID(this.type, this.direction, this.modifier);
	}
};

let canOverwriteBuilding = true;


/**Called once on page load. */
function init(){
	try {
		assert(localStorage.getItem("settings"));
		settings = JSON.parse(localStorage.getItem("settings")!);
	} catch(err){
		console.warn("Invalid persistent settings!\nIf this is your first time visiting this site, nothing to worry about.");
		localStorage.setItem("settings", JSON.stringify(settings));
	}
	
	console.log("%c Hey there! It looks like you're checking out the console.\nIf you want to view the source code, *please do it at* https://github.com/BalaM314/Untitled-Electron-Game \n Make sure to view the .ts files as the .js files are compiled and thus look weird.", "color: blue; font-size: 30px;")

	Gfx.init();
	
	noise.seed(1);
	loadTextures(textureIDs.map(id => ({id})), texturesDiv)
		.then(loadedTextures => {
			Gfx.textures = loadedTextures;
			Game.texturesReady = true;
		});
	
	
	registerEventHandlers();
	
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
		alert("It looks like you're trying to play on a phone. Unfortunately, mobile devices are not currently supported.");
	}
	
	Game.splash.text = Math.random() < 0.95 ? splashes[Math.ceil(Math.random() * (splashes.length - 1))] : raresplashes[Math.ceil(Math.random() * (raresplashes.length - 1))];
	Game.splash.bounceFunc = Math.random() < 0.9 ? Math.sin : Math.tan;
	if(Game.splash.text == "I wonder what this button does!") Game.splash.clickBehavior = () => window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
	
	errorBackground.classList.remove("hidden");
	loadingBackground.classList.add("hidden");
	
	main_loop();
}

init();
