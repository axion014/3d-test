var yrate = 1.5;
var scale = 0.9;
if (window.innerHeight / window.innerWidth > yrate) {
	var SCREEN_WIDTH = window.innerWidth * scale;
	var SCREEN_HEIGHT = window.innerWidth * yrate * scale;
} else {
	var SCREEN_WIDTH = window.innerHeight / yrate * scale;
	var SCREEN_HEIGHT = window.innerHeight * scale;
}
var SCREEN_CENTER_X = SCREEN_WIDTH / 2;
var SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;

phina.display.DisplayScene.default.$extend({
	width: SCREEN_WIDTH,
	height: SCREEN_HEIGHT
});

//3��
var Axis = {
	x : new THREE.Vector3(1,0,0).normalize(),
	y : new THREE.Vector3(0,1,0).normalize(),
	z : new THREE.Vector3(0,0,1).normalize()
};
