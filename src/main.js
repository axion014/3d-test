phina.define('fly.MainSequence', {
	superClass: 'phina.game.ManagerScene',
	init: function() {
		this.superInit({
			scenes: [
				{
					className: 'fly.LoadingScene',
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
								tutorial: 'data/stages/tutorial.min.json'
							}
						}
					}
				},

				{
					label: 'title',
					className: 'fly.TitleScene',
					arguments: {
						title: 'flight game',
						message: 'Click start',
						fontColor: '#fff',
						exitType: 'click'
					}
				},
				{
					label: 'main',
					className: 'fly.MainScene',
					arguments: {
						stage: 'tutorial'
					}
				},
				{
					label: 'gameover',
					className: 'fly.GameOverScene'
				}
			],
		});
	}
});

phina.define('fly.Application', {
	superClass: 'phina.display.CanvasApp',
	init: function() {
		this.superInit({
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
		});
		threeext.extention();
		this.replaceScene(fly.MainSequence());
	},
});

phina.main(function() {
	var app = fly.Application();
	app.run();
});
