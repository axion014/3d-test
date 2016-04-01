phina.define('fly.TitleScene', {
	superClass: 'phina.display.CanvasScene',

	frame: 0,

	init: function(params) {
		this.superInit(params);
		var layer = phina.glfilter.GLFilterLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
		var threelayer = phina.display.ThreeLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
		var flyer = phina.asset.AssetManager.get('threejson', 'fighter').get();
		var sky = phina.asset.AssetManager.get('threecubetex', 'skybox').get();
		var plane = new THREE.Mesh(new THREE.CircleGeometry(10000, 100), new THREE.MeshBasicMaterial({map: phina.asset.AssetManager.get('threetexture', 'plane').get()}));
		flyer.position.y = 1000;
		var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(0, 0, 30);
		sky.update = function() {this.move(flyer.position);};
		plane.update = function() {
			this.position.x = flyer.position.x;
			this.position.z = flyer.position.z;
		};
		plane.rotate(-Math.PI / 2, 0, 0);
		threelayer.scene.add(directionalLight);
		threelayer.scene.add(new THREE.AmbientLight(0x606060));
		threelayer.scene.add(flyer);
		threelayer.scene.add(sky);
		threelayer.scene.add(plane);
		threelayer.update = function(app) { // Update routine
			// Camera control
			threelayer.camera.quaternion.copy(new THREE.Quaternion());
			threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.sin(this.frame * 0.01) * 0.25));
			threelayer.camera.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, Math.PI + this.frame * 0.005));
			var vec = Axis.z.clone().applyQuaternion(threelayer.camera.quaternion).negate().setLength(-100);
			threelayer.camera.position.copy(flyer.position.clone().add(vec));
			threelayer.camera.updateMatrixWorld();
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
		threelayer.addChildTo(layer);
		title.addChildTo(layer);
		message.addChildTo(layer);
		this.on('pointstart', function() {
			this.startframe = 0;
			layer.alphaNode = phina.glfilter.AlphaNode(layer.gl, {
				width: layer.domElement.width, height: layer.domElement.height
			});
			layer.zoomBlurNode = phina.glfilter.ZoomBlurNode(layer.gl, {
				width: layer.domElement.width, height: layer.domElement.height
			});
			layer.zoomBlurNode.setUniform(layer.gl, 'x', SCREEN_CENTER_X);
			layer.zoomBlurNode.setUniform(layer.gl, 'y', SCREEN_CENTER_Y);
			var setfilter = function() {
				layer.alphaNode.setUniform(layer.gl, 'color', [1, 1, 1, this.startframe * 0.025]);
				layer.zoomBlurNode.setUniform(layer.gl, 'strength', this.startframe * 0.4);
				if (this.startframe === 40) {
					layer.headNode.connectTo(layer.destNode);
					this.off('enterframe', setfilter);
					this.exit();
				} else {
					this.startframe++;
				}
			}.bind(this);
			this.on('enterframe', setfilter);
			layer.headNode
				.connectTo(layer.zoomBlurNode)
				.connectTo(layer.alphaNode)
				.connectTo(layer.destNode);
		});
	}
});
