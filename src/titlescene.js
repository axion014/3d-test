phina.define('fly.TitleScene', {
	superClass: 'phina.display.CanvasScene',

	frame: 0,

	init: function(params) {
		this.superInit(params);

		var menu = {
			title: {
				x: 0, y: 0, sub: [
					{type: 'label', value: 'flygame', x: this.gridX.center(), y: this.gridY.span(4), size: 64},
					{type: 'label', value: 'Click start', x: this.gridX.center(), y: this.gridY.span(12), size: 24, link: 'main'},
					{type: 'model', name: 'flyer', value: phina.asset.AssetManager.get('threejson', 'fighter').get(), x: 0, y: 1000, z: 0},
					{type: 'model', value: phina.asset.AssetManager.get('threecubetex', 'skybox').get(), x: 0, y: 1000, z: 0},
					{
						type: 'model', value: new THREE.Mesh(new THREE.CircleGeometry(10000, 100), new THREE.MeshBasicMaterial({
							map: phina.asset.AssetManager.get('threetexture', 'plane').get()
						})), x: 0, y: 0, z: 0, init: function(model) {model.rotate(-Math.PI / 2, 0, 0);}
					}
				]
			},
			main: {
				x: -500, y: -500, sub: [
					{type: 'label', value: 'Main Menu', x: this.gridX.center(), y: this.gridY.span(4), size: 64}
				]
			}
		}

		var layer = phina.glfilter.GLFilterLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
		var threelayer = phina.display.ThreeLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});

		var group = phina.display.CanvasElement();

		var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(0, 0, 30);
		threelayer.scene.add(directionalLight);
		threelayer.scene.add(new THREE.AmbientLight(0x606060));
		threelayer.update = function(app) { // Update routine
			// Camera control
			this.flyer.quaternion.copy(new THREE.Quaternion());
			this.flyer.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.sin(this.frame * 0.01) * 0.25));
			this.flyer.rotate(new THREE.Quaternion().setFromAxisAngle(Axis.y, -Math.PI / 2 + this.frame * 0.005));
			threelayer.camera.position.copy(new THREE.Vector3(-group.x / 15, 1000 + group.y / 15, 100));
			threelayer.camera.updateMatrixWorld();
			this.frame++;
		}.bind(this);
		layer.addChildTo(this);
		threelayer.addChildTo(layer);
		group.addChildTo(layer);
		var moveTo = function(x, y) {
			group.tweener.to({x: x, y: y}, 1000, 'easeInOutCubic').play();
		}
		menu.forIn(function(key, value) {
			for(var j = 0; j < value.sub.length; j++) {
				var selects = value.sub[j];
				if (selects.type === 'label') {
					var label = phina.display.Label({text: selects.value, fill: 'hsla(0, 0%, 0%, 0.6)',
						stroke: false, fontSize: selects.size}).addChildTo(group).setPosition(selects.x - value.x, selects.y - value.y);
					if (selects.link) {
						label.setInteractive(true);
						label.onpointstart = function() {
							moveTo(value[this.menuselects.link]);
						}
					}
				} else if (selects.type === 'model') {
					threelayer.scene.add(selects.value);
					selects.value.position.set(selects.x, selects.y, selects.z);
					if(selects.init) {selects.init(selects.value);}
					if(selects.name) {this[selects.name] = selects.value;}
				}
			}
		}.bind(this));

		var start = function(stage) {
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
					this.exit({stage: stage});
				} else {
					this.startframe++;
				}
			}.bind(this);
			this.on('enterframe', setfilter);
			layer.headNode
				.connectTo(layer.zoomBlurNode)
				.connectTo(layer.alphaNode)
				.connectTo(layer.destNode);
		}
		var moveToMain = function() {
			moveTo(-500, -500);
			this.off('pointstart', moveToMain);
		}
		this.on('pointstart', moveToMain);
	}
});
