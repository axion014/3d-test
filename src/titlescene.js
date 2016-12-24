phina.define('fly.TitleScene', {
	superClass: 'phina.display.DisplayScene',

	frame: 0,

	init: function(params) {
		this.superInit(params);
		var start = function() {
			this.startframe = 0;
			layer.alphaNode = phina.glfilter.AlphaNode(layer.gl, {
				width: layer.domElement.width, height: layer.domElement.height
			});
			layer.zoomBlurNode = phina.glfilter.ZoomBlurNode(layer.gl, {
				width: layer.domElement.width, height: layer.domElement.height
			});
			layer.zoomBlurNode.setUniform(layer.gl, 'x', SCREEN_CENTER_X);
			layer.zoomBlurNode.setUniform(layer.gl, 'y', SCREEN_CENTER_Y);
			var setFilter = function() {
				layer.alphaNode.setUniform(layer.gl, 'color', [1, 1, 1, this.startframe * 0.025]);
				layer.zoomBlurNode.setUniform(layer.gl, 'strength', this.startframe * 0.4);
				if (this.startframe === 40) {
					layer.headNode.connectTo(layer.destNode);
					this.off('enterframe', setFilter);
					this.exit({stage: nowarg.stage, difficulty: nowarg.difficulty});
				} else {
					this.startframe++;
				}
			}.bind(this);
			this.on('enterframe', setFilter);
			layer.headNode
				.connectTo(layer.zoomBlurNode)
				.connectTo(layer.alphaNode)
				.connectTo(layer.destNode);
		}.bind(this);
		var nowarg = {};
		var menu = {
			title: {
				x: 0, y: 0, sub: [
					{type: 'label', value: 'flygame', x: this.gridX.center(), y: this.gridY.span(5), size: 64},
					{type: 'label', value: 'Click start', x: this.gridX.center(), y: this.gridY.span(11), size: 32},
					{type: 'label', value: 'Exit', x: this.gridX.span(2), y: this.gridY.span(15), size: 32, callback: function() {
						history.back();
						window.close();
					}},
					{type: 'model', name: 'flyer', value: phina.asset.AssetManager.get('threejson', 'fighter').get(), x: 0, y: 1000, z: 0},
					{type: 'model', value: phina.asset.AssetManager.get('threecubetex', 'skybox').get(), x: 0, y: 1000, z: 0},
					{type: 'model', value: new THREE.Mesh(new THREE.CircleGeometry(10000, 100), new THREE.MeshBasicMaterial({
						map: phina.asset.AssetManager.get('threetexture', 'plane').get()
					})), x: 0, y: 0, z: 0, init: function(model) {model.rotate(-Math.PI / 2, 0, 0);}}
				]
			},
			main: {
				x: -500, y: -500, sub: [
					{type: 'label', value: 'Main Menu', x: this.gridX.center(), y: this.gridY.span(4), size: 64},
					{type: 'label', value: 'Campaign', x: this.gridX.center(), y: this.gridY.span(6), size: 32, link: 'difficulty'},
					{type: 'label', value: 'Stage Select', x: this.gridX.center(), y: this.gridY.span(7), size: 32, link: 'stageselect'},
					{type: 'label', value: 'Tutorial', x: this.gridX.center(), y: this.gridY.span(8), size: 32, link: 'tutorial'},
					{type: 'label', value: 'Free Mode', x: this.gridX.center(), y: this.gridY.span(9), size: 32, link: 'difficulty', callback: function() {nowarg.stage = 'arcade'}},
					{type: 'label', value: 'Settings', x: this.gridX.center(), y: this.gridY.span(10), size: 32, link: 'setting'},
					{type: 'label', value: 'Back', x: this.gridX.center(), y: this.gridY.span(12), size: 32, link: 'title'}
				]
			},
			tutorial: {
				x: 750, y: 750, sub: [
					{type: 'label', value: 'Tutorial', x: this.gridX.center(), y: this.gridY.span(4.5), size: 64},
					{type: 'label', value: 'Move', x: this.gridX.center(), y: this.gridY.span(6.5), size: 32, callback: function() {nowarg.stage = 'tutorial_move';start();}},
					{type: 'label', value: 'Attack', x: this.gridX.center(), y: this.gridY.span(7.5), size: 32, callback: function() {nowarg.stage = 'tutorial_attack';start();}},
					{type: 'label', value: 'Special', x: this.gridX.center(), y: this.gridY.span(8.5), size: 32, callback: function() {nowarg.stage = 'tutorial_special';start();}},
					{type: 'label', value: 'Space', x: this.gridX.center(), y: this.gridY.span(9.5), size: 32, callback: function() {nowarg.stage = 'tutorial_space';start();}},
					{type: 'label', value: 'Back', x: this.gridX.center(), y: this.gridY.span(11.5), size: 32, link: 'main'}
				]
			},
			stageselect: {
				x: 500, y: -250, sub: [
					{type: 'label', value: 'Stage Select', x: this.gridX.center(), y: this.gridY.span(4), size: 64},
					{type: 'label', value: 'Main Menu', x: this.gridX.center(), y: this.gridY.span(12), size: 32, link: 'main'},
				]
			},
			difficulty: {
				x: -1000, y: -750, sub: [
					{type: 'label', value: 'Difficulty', x: this.gridX.center(), y: this.gridY.span(5), size: 64},
					{type: 'label', value: 'Easy', x: this.gridX.center(), y: this.gridY.span(7), size: 32, callback: function() {nowarg.difficulty = 0.5;start()}},
					{type: 'label', value: 'Normal', x: this.gridX.center(), y: this.gridY.span(8), size: 32, callback: start},
					{type: 'label', value: 'Hard', x: this.gridX.center(), y: this.gridY.span(9), size: 32, callback: function() {nowarg.difficulty = 1.5;start()}},
					{type: 'label', value: 'Back', x: this.gridX.center(), y: this.gridY.span(11), size: 32, link: 'main'}
				]
			},
			setting: {
				x: -250, y: -1250, sub: [
					{type: 'label', value: 'Setting', x: this.gridX.center(), y: this.gridY.span(4), size: 64},
					{type: 'label', value: 'Credit', x: this.gridX.center(), y: this.gridY.span(8), size: 32, link: 'credit'},
					{type: 'label', value: 'Back', x: this.gridX.center(), y: this.gridY.span(12), size: 32, link: 'main'}
				]
			},
			credit: {
				x: -5000, y: -5000, sub: [
					{type: 'label', value: 'Credit', x: this.gridX.center(), y: this.gridY.span(4), size: 64},
					{type: 'label', value: 'Programing: Shu', x: this.gridX.center(), y: this.gridY.span(6), size: 32},
					{type: 'label', value: 'Back', x: this.gridX.center(), y: this.gridY.span(12), size: 32, link: 'setting'}
				]
			}
		}

		var layer = phina.glfilter.GLFilterLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
		var threelayer = phina.display.ThreeLayer({width: SCREEN_WIDTH, height: SCREEN_HEIGHT});
		threelayer.setOrigin(0, 0);

		var group = phina.display.DisplayElement();

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
			if (group.position.distance(phina.geom.Vector2(x, y)) > 2000) {
				group.tweener.to({x: x, y: y}, group.position.distance(phina.geom.Vector2(x, y)) / 3, 'easeInOutQuint').play();
			} else {
				group.tweener.to({x: x, y: y}, 1000, 'easeInOutCubic').play();
			}
		}
		menu.forIn(function(key, value) {
			for(var j = 0; j < value.sub.length; j++) {
				var selects = value.sub[j];
				if (selects.type === 'label') {
					var label = phina.display.Label({x: selects.x - value.x, y: selects.y - value.y,
						text: selects.value, fill: 'hsla(0, 0%, 0%, 0.6)',
						stroke: false, fontSize: selects.size}).addChildTo(group);
					if (selects.link) {
						label.setInteractive(true);
						phina.namespace(function() {
							var link = selects.link;
							label.on('pointstart', function() {
								moveTo(menu[link].x, menu[link].y);
								if (link === 'title') {
									this.one('enterframe', function() {
										this.one('pointstart', moveToMain);
									}, this);
								}
							}, this);
						}.bind(this));
					}
					if (selects.callback) {
						label.setInteractive(true);
						phina.namespace(function() {
							var callback = selects.callback;
							label.on('pointstart', callback);
						});
					}
				} else if (selects.type === 'model') {
					threelayer.scene.add(selects.value);
					selects.value.position.set(selects.x, selects.y, selects.z);
					if(selects.init) {selects.init(selects.value);}
					if(selects.name) {this[selects.name] = selects.value;}
				}
			}
		}.bind(this));
		var moveToMain = moveTo.bind(undefined, -500, -500);
		this.one('pointstart', moveToMain);
	}
});
