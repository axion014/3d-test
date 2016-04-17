var SCREEN_WIDTH = 480;
var SCREEN_CENTER_X = 240;
var SCREEN_HEIGHT = 720;
var SCREEN_CENTER_Y = 360;

phina.display.DisplayScene.default = {
	width: SCREEN_WIDTH,
	height: SCREEN_HEIGHT
};

//3��
var Axis = {
	x : new THREE.Vector3(1,0,0).normalize(),
	y : new THREE.Vector3(0,1,0).normalize(),
	z : new THREE.Vector3(0,0,1).normalize()
};
