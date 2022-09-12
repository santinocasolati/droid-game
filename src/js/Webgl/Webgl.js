import * as THREE from 'three';
import * as CANNON from 'cannon-es';
// import gsap from 'gsap';

class PlayerMovement {
    constructor(player, camera, floorBody) {
        this.player = player;
        this.camera = camera;
        this.floorBody = floorBody;

        this.setMovement();
    }

    setMovement() {
        this.keysPressed = {
            w: false,
            s: false,
            a: false,
            d: false,
            space: false
        }

        window.addEventListener("keydown", (e) => {
            const key = e.code.toLowerCase();
            switch (key) {
                case 'keyw':
                    this.keysPressed.w = true;
                    break;

                case 'keys':
                    this.keysPressed.s = true;
                    break;

                case 'keya':
                    this.keysPressed.a = true;
                    break;

                case 'keyd':
                    this.keysPressed.d = true;
                    break;

                case 'space':
                    this.keysPressed.space = true;
                    break;

                default:
                    break;
            }
        });

        window.addEventListener("keyup", (e) => {
            const key = e.code.toLowerCase();
            switch (key) {
                case 'keyw':
                    this.keysPressed.w = false;
                    break;

                case 'keys':
                    this.keysPressed.s = false;
                    break;

                case 'keya':
                    this.keysPressed.a = false;
                    break;

                case 'keyd':
                    this.keysPressed.d = false;
                    break;

                case 'space':
                    this.keysPressed.space = false;
                    break;

                default:
                    break;
            }
        });

        this.player.body.addEventListener("collide", (e) => {
            if (e.body === this.floorBody) {
                this.canJump = true;
            }
        });

        this.axisY = new CANNON.Vec3(0, 1, 0);
        this.rotationQuaternion = new CANNON.Quaternion();
        this.localVelocity = new CANNON.Vec3();
        this.moveDistance = 35;
        this.jumpVelocity = 8;
        this.canJump = false;
    }

    update(delta) {
        let rotateAngle = (Math.PI / 2) * delta;

        if (this.keysPressed.a) {
            this.rotationQuaternion.setFromAxisAngle(this.axisY, rotateAngle);
            this.player.body.quaternion = this.rotationQuaternion.mult(this.player.body.quaternion);
        }

        if (this.keysPressed.d) {
            this.rotationQuaternion.setFromAxisAngle(this.axisY, -rotateAngle);
            this.player.body.quaternion = this.rotationQuaternion.mult(this.player.body.quaternion);
        }

        this.localVelocity.set(0, 0, this.moveDistance * 0.2);
        const worldVelocity = this.player.body.quaternion.vmult(this.localVelocity);

        if (this.keysPressed.w) {
            this.player.body.velocity.x = -worldVelocity.x;
            this.player.body.velocity.z = -worldVelocity.z;
        }

        if (this.keysPressed.s) {
            this.player.body.velocity.x = worldVelocity.x;
            this.player.body.velocity.z = worldVelocity.z;
        }

        if (this.keysPressed.space) {
            this.jump();
        }

        this.camera.position.x = this.player.mesh.position.x + 5;
        this.camera.position.y = this.player.mesh.position.y + 10;
        this.camera.position.z = this.player.mesh.position.z + 10;
    }

    jump() {
        if (this.canJump) {
            this.canJump = false;
            this.player.body.velocity.y = this.jumpVelocity;
        }
    }
}

class Physics {
    constructor() {
        this.physics();
    }

    physics() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0);
        this.world.broadphase = new CANNON.NaiveBroadphase();

        this.physicsArray = [];

        this.material = new CANNON.Material();
        this.contactMaterial = new CANNON.ContactMaterial(this.material, this.material, { friction: 0.0, restitution: 0.0 });
        this.world.addContactMaterial(this.contactMaterial);
    }

    floor() {
        this.floorBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane()
        });

        this.floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.world.addBody(this.floorBody);

        return this.floorBody;
    }

    worldBorder(pos) {

        for (const dimension in pos) {
            if (Object.hasOwnProperty.call(pos, dimension)) {
                const dim = pos[dimension];

                for (const arr in dim) {
                    if (Object.hasOwnProperty.call(dim, arr)) {
                        const positions = dim[arr];

                        const border = new CANNON.Body({
                            mass: 0,
                            shape: new CANNON.Box(new CANNON.Vec3(300 * 0.5, 10 * 0.5, 2 * 0.5)),
                            material: this.material
                        });

                        if (positions[2] !== 0) {
                            border.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
                        }

                        border.position.x = positions[0];
                        border.position.z = positions[1];

                        this.world.addBody(border);
                    }
                }
            }
        }
    }

    setPlayer(box) {
        const boxBody = new CANNON.Body({
            mass: 5,
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            linearDamping: 0.5,
            angularDamping: 1.0,
            material: this.material
        });
        boxBody.position.copy(box.position);

        this.world.addBody(boxBody);

        this.physicsArray.push({
            mesh: box,
            body: boxBody
        });

        return boxBody;
    }

    update() {
        this.world.step(1 / 60);

        for (const object of this.physicsArray) {
            object.mesh.position.copy(object.body.position);
            object.mesh.quaternion.copy(object.body.quaternion);
        }
    }
}

export default class Webgl {
    constructor(options) {
        this.container = options.domElement;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camera.position.set(5, 10, 10);
        this.camera.lookAt(0, 0, 0);

        this.floorColor = new THREE.Color("#ccc");
        this.scene = new THREE.Scene();
        this.scene.background = this.floorColor;

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();

        this.physics = new Physics();

        this.lights();
        this.floor();
        this.setPlayer();

        this.resize();
        this.setupResize();
        this.render();
    }

    lights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.castShadow = true;
        // directionalLight.shadow.radius = 0.5;
        directionalLight.position.set(0, 300, 0);
        directionalLight.shadow.mapSize.width = 10240;
        directionalLight.shadow.mapSize.height = 10240;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.top = -150;
        directionalLight.shadow.camera.right = 150;
        directionalLight.shadow.camera.left = -150;
        directionalLight.shadow.camera.bottom = 150;
        this.scene.add(directionalLight);
    }

    floor() {
        this.floor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 1, 1),
            new THREE.MeshStandardMaterial({
                color: this.floorColor
            })
        );

        this.scene.add(this.floor);

        this.floor.receiveShadow = true;
        this.floor.rotateX(-Math.PI / 2);
        this.floorBody = this.physics.floor();

        const borderPos = {
            z: {
                pos: [0, 50, 0],
                neg: [0, -50, 0]
            },
            x: {
                pos: [50, 0, 1],
                neg: [-50, 0, 1]
            }
        };

        this.physics.worldBorder(borderPos);
    }

    setPlayer() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 'green' })
        );
        box.position.y = 3;
        box.castShadow = true;

        this.scene.add(box);

        const boxBody = this.physics.setPlayer(box);

        this.player = {
            mesh: box,
            body: boxBody
        }

        this.playerControls = new PlayerMovement(this.player, this.camera, this.floorBody);
    }

    resize() {
        setTimeout(() => {
            this.width = window.innerWidth;
            this.height = window.outerHeight;

            this.renderer.setSize(this.width, this.height);

            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        }, 300);
    }

    setupResize() {
        window.addEventListener('resize', this.resize.bind(this));
    }

    render() {
        const delta = this.clock.getDelta();

        this.playerControls.update(delta);
        this.physics.update();

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this))
    }
}