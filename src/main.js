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
								fighter: 'data/models/fighter-1.min.json',
								enem1: 'data/models/enem-1.min.json',
								enem2: 'data/models/fighter-2.min.json',
								enem3: 'data/models/enem-3.min.json',
								bullet: 'data/models/bullet.min.json'
							},
							threetexture: {
								explode: 'data/explosion.png',
								plane: 'data/3.png'
							},
							threecubetex: {
								skybox: 'data/skybox/ .png'
							},
							text: {
								expvertexshader: 'data/glsl/expvertexshader.min.glsl',
								expfragshader: 'data/glsl/expfragshader.min.glsl'
							},
							stage: {
								s1n: 'data/stages/stage1-n.min.json'
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
						stage: 's1n'
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
