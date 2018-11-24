function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
};

var santaBattle = function(opts){

	this.opts = {};

	this.opts.loadViewTarget = opts.loadView || false;
	this.opts.player = opts.player || false;
	this.opts.level = opts.level || 1;
	this.opts.pieces = opts.pieces;
	this.html = opts.html;

	if(this.opts.loadViewTarget && this.opts.player){
		this.loadView = $(this.opts.loadViewTarget);
		this.init();
	};
};

/* Services */

santaBattle.prototype.buildPiece = function(obj){
	var piece = '<div';
	if(obj.id)piece += ' id="' + obj.id + '"';
	if(obj.class)piece += ' class="' + obj.class + '"';
	if(obj.type)piece += ' data-type="' + obj.type + '"';
	piece += '></div>';
	return piece;
};

/* Controls */

santaBattle.prototype.bindControls = function(){
	document.addEventListener("keydown", this.idKey.bind(this), false);
};

santaBattle.prototype.idKey = function(e){
	switch(e.keyCode){
		case 38: // arrow up
		case 87: // w
			this.keyUp();
		break;
		case 40: // down
		case 83: // s
			this.keyDown();
		break;
		case 37: // left
		case 65: // a
			this.keyLeft();
		break;
		case 39: // right
		case 68: // d
			this.keyRight();
		break;
		case 32: // space

		break;
	};
};

/* Player Actions */

santaBattle.prototype.keyUp = function(){
	this.movePlayer('up');
};

santaBattle.prototype.keyDown = function(){
	this.movePlayer('down');
};

santaBattle.prototype.keyLeft = function(){
	this.movePlayer('left');
};

santaBattle.prototype.keyRight = function(){
	this.movePlayer('right');
};

santaBattle.prototype.movePlayer = function(dir){
	switch(dir){
		case 'up':
			this.player.top -= 20;
		break;
		case 'down':
			this.player.top += 20;
		break;
		case 'left':
			this.player.left -= 20;
		break;
		case 'right':
			this.player.left += 20;
		break;
	}

	if(this.player.top < 0) this.player.top = 0;
	if(this.player.left < 0) this.player.left = 0;

	if(this.player.top > (this.loadView[0].scrollHeight - this.player.target[0].scrollHeight)) this.player.top = this.loadView[0].scrollHeight - this.player.target[0].scrollHeight;

	this.setPlayerPos();
};

santaBattle.prototype.loadPlayer = function(){
	var html = this.buildPiece(this.opts.player);
	this.loadView.append(html);
	this.player = {
		target:$('#' + this.opts.player.id),
		top:300,
		left:0
	};
	this.setPlayerPos();
};

santaBattle.prototype.setPlayerPos = function(top, left){
	this.player.target.css({
		top:this.player.top + 'px',
		left:this.player.left + 'px'
	});
};

/* Loading Pieces */

santaBattle.prototype.selectPiece = function (){
	// add up all the weights
	var weightSum = 0;
	for(var i = 0; i < this.opts.pieces.length; i++){
		weightSum+= this.opts.pieces[i].weight;
	};

	while(weightSum > 0){

		// select random piece index

		var index = Math.floor(Math.random() * Math.floor(this.opts.pieces.length - 1));

		// select random piece index

		weightSum -= this.opts.pieces[index].weight;

		if(weightSum > 0){
			for(var j = 0; j < this.opts.pieces.length; j++){
				if(this.opts.pieces[j].weight === weightSum){
					return clone(this.opts.pieces[j]);
				}
			}
		}
	};

	return false;
};

santaBattle.prototype.loadPiece = function (obj){
	var html = this.buildPiece(obj);
	this.loadView.append(html);
};

/* Piece setup functions (new instance required) */

santaBattle.prototype.pieceSetup = function(opts){

	this.piece = opts.piece;
	this.pieceLoadView = opts.loadView;
	this.pieceTarget = $('#' + this.piece.id);
	this.removeFn = opts.removeFn;

	var topPos = Math.floor(Math.random() * Math.floor(this.pieceLoadView[0].clientHeight - this.pieceTarget[0].clientHeight)),
		leftPos = this.pieceLoadView[0].clientWidth - this.pieceTarget[0].clientWidth;

	this.pieceTarget.css({
		top: topPos + "px",
		left: leftPos + "px"
	});

	this.anim();
};

santaBattle.prototype.pieceSetup.prototype.anim = function(){
	var _ = this;
	this.pieceAnim = setInterval(_.animLeft.bind(_),300);
};

santaBattle.prototype.pieceSetup.prototype.animLeft = function(){
	this.pieceTarget.css({
		left: this.pieceTarget[0].offsetLeft - 20 + "px"
	});

	if(this.pieceTarget[0].offsetLeft <= -this.pieceTarget[0].clientWidth){
		this.pieceTarget[0].remove();
		this.removeFn(this.piece.id);
		clearInterval(this.pieceAnim);

	};
};

/**************************************************/

santaBattle.prototype.initPieces = function (){
	this.loadedPieces = [];
	var count = 0;

	var _ = this;

	setInterval(function(){
		var piece = _.selectPiece();
		if(piece){
			count += 1;
			piece.id = 'piece' + count;
			_.loadPiece(piece);
			_.loadedPieces.push(piece);
			
			// Create new instance for piece setup and animations
			this["activePiece" + piece.id] = new _.pieceSetup({
				piece:piece,
				loadView: _.loadView,
				removeFn: _.removeLoadedPiece.bind(_)
			});
		};
	}, 10000); // random interval depending on level
};

santaBattle.prototype.removeLoadedPiece = function (id){
	for(var i = 0; i < this.loadedPieces.length; i++){
		if(this.loadedPieces[i].id === id){
			this.loadedPieces.splice(i,1);
			return;
		};
	};
};


santaBattle.prototype.initCollisionWatch = function(){
	var _ = this;
	this.collisionWatch = setInterval(_.collisionTest.bind(_),100);
};


santaBattle.prototype.collisionTest = function(){
	this.identifyPiecePositions();
	this.positionData(this.opts.player);
	this.closePieces = this.getClosePieces();
	this.result = this.identifyCollision();
	console.log(this.result);
};

santaBattle.prototype.identifyCollision = function(){
	for(var i = 0; i < this.closePieces.length; i++){
		var piece = this.closePieces[i];
		
		if(
			this.opts.player.x + this.opts.player.width >= piece.x &&
			this.opts.player.x < piece.x + piece.width &&
			this.opts.player.y + this.opts.player.height > piece.y &&
			this.opts.player.y < piece.y + piece.height
		){
			return piece;
		};
	};
	return false;
};

// piece.y < this.opts.player.y + this.opts.player.height ||
// 		piece.y + piece.height < this.opts.player.y + this.opts.player.height 
// 		&&
// 		piece.x < this.opts.player.x + this.opts.player.width ||
// 		piece.x + piece.width < this.opts.player.x

santaBattle.prototype.getClosePieces = function(){
	var array = [];

	for(var i = 0; i < this.loadedPieces.length; i++){
		if(this.loadedPieces[i].x < this.opts.player.x + this.opts.player.width + 10){
			var obj = {
				id: this.loadedPieces[i].id,
				width:this.loadedPieces[i].width,
				height:this.loadedPieces[i].height,
				x:this.loadedPieces[i].x,
				y:this.loadedPieces[i].y
			};
			array.push(obj);
		};
	};
	return array;
};

santaBattle.prototype.identifyPiecePositions = function(){
	for(var i = 0; i < this.loadedPieces.length; i++){
		this.positionData(this.loadedPieces[i]);
	};
};

santaBattle.prototype.positionData = function(obj){
	var target = $("#" + obj.id),
		pos = target[0].getBoundingClientRect();
	obj.width = target[0].clientWidth;
	obj.height = target[0].clientHeight;
	obj.y = Math.floor(pos.top);
	obj.x = Math.floor(pos.left);
};


/* Init functions */

santaBattle.prototype.init = function(){
	var _ = this;
	$('#startGame').off('click').on('click', function(){
		_.startGame();
	});
};

santaBattle.prototype.startGame = function(){
	this.bindControls();
	this.loadPlayer();
	this.initPieces();
	this.initCollisionWatch();
};

(function(){

	$(function(){
		const game = new santaBattle({
			loadView:'#santaBattle',
			player: {
				id:'player1',
				class:'c-santa'
			},
			level:1,
			pieces:[
				{
					class:"c-piece c-piece--present",
					points:10,
					type:"collectable",
					weight:5
				},
				{
					class:"c-piece c-piece--bonus",
					points:50,
					type:"collectable",
					weight:1
				},
				{
					class:"c-piece c-piece--old-boot",
					type:"baddie",
					weight:3
				},
				{
					class:"c-piece c-piece--evil-elf",
					type:"baddie",
					weight:4
				}
			],
			chimney:{
				class:"c-chimney",
				type:"catcher",
				weight:2,
				points:30
			}
		});
	});
})();