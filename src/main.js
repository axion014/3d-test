phina.define('nfc.MainSequence', {
	superClass: 'phina.game.ManagerScene',
	init: function() {
		this.superInit({
			scenes: [
				{
					className: 'nfc.LoadingScene',
					arguments: {
						lie: false,
						assets: {
							threejson: {
								fighter: 'https://cdn.rawgit.com/axion014/3d-test/master/data/models/fighter-1.min.json',
								enem1: 'https://cdn.rawgit.com/axion014/3d-test/master/data/models/enem-1.min.json',
								enem2: 'https://cdn.rawgit.com/axion014/3d-test/master/data/models/fighter-2.min.json',
								enem3: 'https://cdn.rawgit.com/axion014/3d-test/master/data/models/enem-3.min.json',
								bullet: 'https://cdn.rawgit.com/axion014/3d-test/master/data/models/bullet.min.json'
							},
							threetexture: {
								explode: 'https://cdn.rawgit.com/axion014/3d-test/master/data/explosion.png',
								plane: 'https://cdn.rawgit.com/axion014/3d-test/master/data/3.png'
							},
							threecubetex: {
								skybox: 'https://cdn.rawgit.com/axion014/3d-test/master/data/skybox/ .png'
							},
							text: {
								expvertexshader: 'https://cdn.rawgit.com/axion014/3d-test/master/data/glsl/expvertexshader.min.glsl',
								expfragshader: 'https://cdn.rawgit.com/axion014/3d-test/master/data/glsl/expfragshader.min.glsl'
							},
							stage: {
								tutorial: 'https://cdn.rawgit.com/axion014/3d-test/master/data/stages/tutorial.min.json'
							}
						}
					}
				},

				{
					label: 'title',
					className: 'nfc.TitleScene',
					arguments: {
						title: 'flight game',
						message: 'Click start',
						exitType: 'click'
					}
				},
				{
					label: 'main',
					className: 'nfc.MainScene',
					arguments: {
						stage: 'tutorial'
					}
				},
				{
					label: 'gameover',
					className: 'nfc.GameOverScene'
				}
			],
		});
	}
});

phina.define('nfc.Application', {
	superClass: 'phina.display.CanvasApp',
	init: function() {
		this.superInit({
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
		});
		threeext.extention();
		this.replaceScene(nfc.MainSequence());
	},
});

phina.main(function() {
	var app = nfc.Application();
	app.run();
});
