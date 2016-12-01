phina.define('fly.BulletManager', {
	superClass: 'fly.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.threescene = ts;
		this.bullet = phina.asset.AssetManager.get('threejson', 'bullet').get();
	},

	createBullet: function(r) {
		var bullet = this.bullet.clone();
		THREE.$extend(bullet, r).$safe({
			v: 1, size: 1, atk: 1,
			update: function(){
				this.position.addScaledVector(Axis.z.clone().applyQuaternion(this.quaternion).normalize(), this.v);
			}
		});
		this.threescene.add(bullet);
		this.elements.push(bullet);
		return bullet;
	},

	update: function() {this.each(function(bullet) {bullet.update();});},

	removeBullet: function(i) {
		this.get(i).parent.remove(this.get(i));
		this.remove(i);
	}
});
