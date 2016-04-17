phina.define('fly.EffectManager', {
	superClass: 'fly.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.explodeManager = fly.ExplodeManager(ts).addChildTo(this);
		this.rayManager = fly.RayManager(ts).addChildTo(this);
		this.threescene = ts;
	},

	explode: function(p, s, t) {return this.explodeManager.explode(p, s, t);},
	ray: function(g, c, o, w, mw, t) {return this.rayManager.ray(g, c, o, w, mw, t);},
});

phina.define('fly.ExplodeManager', {
	superClass: 'fly.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.threescene = ts;
	},

	explode: function(p, s, t) {
		var material = new THREE.ShaderMaterial({
			transparent: true,
			uniforms: {
				tExplosion: {type: "t", value: phina.asset.AssetManager.get('threetexture', 'explode').get()},
				time: {type: "f", value: 100 * Math.random()}, alpha: {type: "f", value: 1.0}
			},
			vertexShader: phina.asset.AssetManager.get('text', 'expvertexshader').data,
			fragmentShader: phina.asset.AssetManager.get('text', 'expfragshader').data
		});
		var mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(20, 2), material).$safe({
			time: t, timeMax: t
		}).$safe({
			time: 10, timeMax: 10,
			update: function() {
				this.time--;
				material.uniforms.time.value += 0.015 * Math.random();
				material.uniforms.alpha.value = this.time / this.timeMax;
			}
		});
		mesh.move(p);
		mesh.scale.set(s, s, s);
		this.threescene.add(mesh);
		this.elements.push(mesh);
		return mesh;
	},

	update: function() {
		for (var i = 0; i < this.elements.length; i++) {
			this.get(i).update();
			if (this.get(i).time === 0) {
				this.get(i).parent.remove(this.get(i));
				this.elements.splice(i, 1);
				i--;
			}
		}
	}
});

phina.define('fly.RayManager', {
	superClass: 'fly.SimpleUpdater',

	init: function(ts) {
		this.superInit();
		this.threescene = ts;
	},

	ray: function(g, c, o, w, mw, t) {
		var upperSphere = new THREE.Mesh(new THREE.SphereGeometry(w, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2));
		upperSphere.position.set(0, -500, 0);
		var ray = new THREE.Mesh(new THREE.CylinderGeometry(w, w, 1000, 20, 10), new THREE.MeshBasicMaterial({
			color: c, opacity: o, transparent: true
		})).$safe({
			time: t, timeMax: t, generator: g, length: 500 + mw, update:function(){this.time--;}
		});
		ray.geometry.merge(upperSphere.geometry);
		this.threescene.add(ray);
		this.elements.push(ray);
		return ray;
	},

	update: function() {
		for (var i = 0; i < this.count(); i++) {
			this.get(i).update();
			this.get(i).move(this.get(i).generator.position.clone().add(Axis.z.clone().applyQuaternion(
				this.get(i).generator.quaternion).setLength(this.get(i).length)));
			this.get(i).quaternion.copy(new THREE.Quaternion().setFromAxisAngle(Axis.x, Math.PI / 2));
			this.get(i).quaternion.rotate(this.get(i).generator.quaternion);
			if (this.get(i).time === 0) {
				this.get(i).parent.remove(this.get(i));
				this.elements.splice(i, 1);
				i--;
			}
		}
	}
});
