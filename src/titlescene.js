phina.define('fly.TitleScene', {
	superClass: 'phina.display.CanvasScene',

	frame: 0,

	init: function(params) {
		this.superInit(params);
		var layer = phina.display.ThreeLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
		var flyer = phina.asset.AssetManager.get('threejson', 'fighter').get();
		var sky = phina.asset.AssetManager.get('threecubetex', 'skybox').get();
		var plane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000), new THREE.MeshBasicMaterial({map: phina.asset.AssetManager.get('threetexture', 'plane').get()}));
		flyer.position.y = 1000;
		var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(0, 0, 30);
		sky.update = function() {this.move(flyer.position);};
		plane.update = function() {
			this.position.x = flyer.position.x;
			this.position.z = flyer.position.z;
		};
		plane.rotate(-Math.PI / 2, 0, 0);
		layer.scene.add(directionalLight);
		layer.scene.add(new THREE.AmbientLight(0x606060));
		layer.scene.add(flyer);
		layer.scene.add(sky);
		layer.scene.add(plane);
		layer.update = function(app) { // Update routine
			// Camera control
			layer.camera.quaternion.copy(new THREE.Quaternion());
			layer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.sin(this.frame * 0.01) * 0.25));
			layer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, Math.PI + this.frame * 0.005));
			var vec = Axis.z.clone().applyQuaternion(layer.camera.quaternion).negate().setLength(-100);
			layer.camera.position.copy(flyer.position.clone().add(vec));
			layer.camera.updateMatrixWorld();
			this.frame++;
		}.bind(this);
		var title = phina.display.Label({
			text: 'flygame', fill: 'hsla(0, 0%, 0%, 0.6)',
			stroke: false, fontSize: 64,
		}).setPosition(this.gridX.center(), this.gridY.span(4));
		var message = phina.display.Label({
			text: 'Click start', fill: 'hsla(0, 0%, 0%, 0.6)',
			stroke: false, fontSize: 24,
		}).setPosition(this.gridX.center(), this.gridY.span(12));
		layer.addChildTo(this);
		title.addChildTo(this);
		message.addChildTo(this);
		this.on('pointstart', function() {this.exit();});
	}
});
