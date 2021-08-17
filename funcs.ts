



/**
 * Utility Functions
 * 
 * 
 */

//.protptype.
interface Array<T> {
	last: Function
}
(Array).prototype.last = function():any{
	return this[this.length - 1];
}



//general function
function sq(x:number):number{
	return x * x;
}
const programStart = new Date();
function millis():number{
	return (new Date()).valueOf() - programStart.valueOf();
}

function gcd(x:number, y:number):any{
	if((typeof x !== 'number') || (typeof y !== 'number')){
		return false;
	}
	x = Math.abs(x);
	y = Math.abs(y);
	while(y) {
		var t = y;
		y = x % y;
		x = t;
	}
	return x;
}
function random(min:number,max:number):number{
	if(arguments.length > 2){
		throw new Error("Too many arguments for random");
	}
	if(arguments.length == 1){
		max = min;
		min = 0;
	}
	if(arguments.length == 0){
		min = 0;
		max = 1;
	}
	return Math.random()*(max-min) + min;
}
function range(start:number, end:number){
	let temp = [];
	for(let i = start; i <= end; i ++){
		temp.push(i);
	}
	return temp;
}

/**
 * Drawing Functions
 * 
 */

enum rectMode {
	CENTER,
	CORNER
}

function rect(x:number, y:number, w:number, h:number, mode?:rectMode, _ctx?:CanvasRenderingContext2D){
	_ctx = _ctx ?? ctx;
	mode = mode ?? rectMode.CORNER;
	if(mode == rectMode.CENTER){
		_ctx.fillRect(x - w/2, y - w/2, w, h);
	} else if(mode == rectMode.CORNER){
		_ctx.fillRect(x, y, w, h);
	} else {
		console.warn("invalid mode to rect()");
	}
}






/**
 * Game-related functions
 */

function tileToChunk(tileCoord:number):number{
	tileCoord = Math.floor(tileCoord);
	if(tileCoord < 0){
		return (tileCoord % consts.CHUNK_SIZE) + consts.CHUNK_SIZE;
	} else {
		return tileCoord % consts.CHUNK_SIZE;
	}
}
