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
								bullet: 'data/models/bullet.min.json'
							},
							threetexture: {
								explode: 'data/images/explosion.png',
								goal: 'data/images/goal.png',
								goal_disable: 'data/images/goal_disable.png',
								plane: 'data/images/3.png'
							},
							threecubetex: {
								skybox: 'data/images/skybox/ .png'
							},
							text: {
								expvertexshader: 'data/glsl/expvertexshader.min.glsl',
								expfragshader: 'data/glsl/expfragshader.min.glsl',
								goalvertexshader: 'data/glsl/goalvertexshader.min.glsl',
								goalfragshader: 'data/glsl/goalfragshader.min.glsl'
							}
						}
					}
				},
				{
					label: 'title',
					className: 'fly.TitleScene',
				},
				{
					label: 'main',
					className: 'fly.MainScene',
				}
			]
		});
	}
});

phina.define('fly.Application', {
	superClass: 'phina.display.CanvasApp',
	init: function() {
		this.superInit({
			width: SCREEN_WIDTH,
			height: SCREEN_HEIGHT,
			query: '#game',
			fit: true
		});
		threeext.extention();
		this.replaceScene(fly.MainSequence());
	},
});

phina.main(function() {
	var app = fly.Application();
	app.run();
});
