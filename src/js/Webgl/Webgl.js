import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from "cannon-es-debugger";
import gsap from "gsap";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

class PlayerControls {
    constructor(mesh, bodies, camera, camDistance, light) {
        this.mesh = mesh;
        this.body = bodies[0];
        this.floor = bodies[1];
        this.camera = camera;
        this.camDistance = camDistance;
        this.light = light;

        this.init();
    }

    init() {
        this.addListeners();
    }

    addListeners() {
        this.keysPressed = {
            forward: false,
            backward: false,
            right: false,
            left: false,
            shift: 1,
            jump: false
        }

        this.canJump = false;
        this.rotationQuaternion = new CANNON.Quaternion();
        this.axisY = new CANNON.Vec3(0, 1, 0);
        this.moveDistance = 15;
        this.localVelocity = new CANNON.Vec3();

        this.body.addEventListener('collide', (e) => {
            if (e.body === this.floor) {
                this.canJump = true;
            }
        })

        document.addEventListener("keydown", (e) => {
            const key = e.key.toLowerCase();

            switch (key) {
                case "w":
                case "arrowup":
                    this.keysPressed.forward = true;
                    break;

                case "a":
                case "arrowleft":
                    this.keysPressed.left = true;
                    break;

                case "s":
                case "arrowdown":
                    this.keysPressed.backward = true;
                    break;

                case "d":
                case "arrowright":
                    this.keysPressed.right = true;
                    break;

                case "shift":
                    this.keysPressed.shift = 1.5;
                    break;

                default:
                    break;
            }

            if (e.code.toLowerCase() === "space") {
                this.keysPressed.jump = true;
            }
        });

        document.addEventListener("keyup", (e) => {
            const key = e.key.toLowerCase();

            switch (key) {
                case "w":
                case "arrowup":
                    this.keysPressed.forward = false;
                    break;

                case "a":
                case "arrowleft":
                    this.keysPressed.left = false;
                    break;

                case "s":
                case "arrowdown":
                    this.keysPressed.backward = false;
                    break;

                case "d":
                case "arrowright":
                    this.keysPressed.right = false;
                    break;

                case "shift":
                    this.keysPressed.shift = 1;
                    break;

                default:
                    break;
            }

            if (e.code.toLowerCase() === "space") {
                this.keysPressed.jump = false;
            }
        });
    }

    jump() {
        if (this.canJump) {
            this.canJump = false;

            this.body.velocity.y = 8;
        }
    }

    update(delta) {
        this.body.velocity.x = 0;
        this.body.velocity.z = 0;

        let rotateAngle = (Math.PI / 2) * delta;
        this.localVelocity.set(0, 0, this.moveDistance * 0.2);
        const worldVelocity = this.body.quaternion.vmult(this.localVelocity);

        if (!(this.keysPressed.forward && this.keysPressed.backward)) {
            if (this.keysPressed.forward) {
                this.body.velocity.x = -worldVelocity.x * this.keysPressed.shift;
                this.body.velocity.z = -worldVelocity.z * this.keysPressed.shift;
            }

            if (this.keysPressed.backward) {
                this.body.velocity.x = worldVelocity.x;
                this.body.velocity.z = worldVelocity.z;
            }
        }

        if (this.keysPressed.left) {
            this.rotationQuaternion.setFromAxisAngle(this.axisY, rotateAngle);
            this.body.quaternion = this.rotationQuaternion.mult(this.body.quaternion);
        }

        if (this.keysPressed.right) {
            this.rotationQuaternion.setFromAxisAngle(this.axisY, -rotateAngle);
            this.body.quaternion = this.rotationQuaternion.mult(this.body.quaternion);
        }

        if (this.keysPressed.jump) {
            this.jump();
        }

        this.camera.position.x = this.mesh.position.x + this.camDistance.x;
        this.camera.position.y = this.mesh.position.y + this.camDistance.y;
        this.camera.position.z = this.mesh.position.z + this.camDistance.z;
    }
}

class Physics {
    constructor(testScene) {
        this.testScene = testScene;

        this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

        this.physicsArray = [];

        this.init();
    }

    init() {
        this.debug();
        this.contactMaterials();
        this.ground();
    }

    debug() {
        this.debugger = new CannonDebugger(this.testScene, this.world);

        const axes = new THREE.AxesHelper(8);
        this.testScene.add(axes);
    }

    contactMaterials() {
        this.groundMaterial = new CANNON.Material();
        this.playerMaterial = new CANNON.Material();

        const playerContact = new CANNON.ContactMaterial(
            this.groundMaterial,
            this.playerMaterial,
            {
                friction: 0,
                restitution: 0
            }
        );

        this.world.addContactMaterial(playerContact);
    }

    ground() {
        this.groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane(),
            material: this.groundMaterial
        });

        this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(this.groundBody);
    }

    player(bounds, mesh) {
        const playerBody = new CANNON.Body({
            shape: new CANNON.Box(new CANNON.Vec3(bounds.x * 0.5, bounds.y * 0.5, bounds.z * 0.5)),
            mass: 5,
            position: new CANNON.Vec3(0, 6, 0),
            material: this.playerMaterial,
            linearDamping: 0.5,
            angularDamping: 1.0
        });
        this.world.addBody(playerBody);

        this.physicsArray.push([mesh, playerBody]);

        return [playerBody, this.groundBody];
    }

    update() {
        this.world.fixedStep();
        this.debugger.update();

        this.physicsArray.forEach(pa => {
            pa[0].position.copy(pa[1].position);
            pa[0].quaternion.copy(pa[1].quaternion);
        });
    }
}

export default class Webgl {
    constructor(options) {
        this.container = options.domElement;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camDistance = new THREE.Vector3(2, 5, 10);
        this.camera.position.copy(this.camDistance);
        this.camera.lookAt(0, 0, 0);

        this.scene = new THREE.Scene();
        this.testScene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.loader = new GLTFLoader();

        this.physics = new Physics(this.testScene);

        this.init();
    }

    init() {
        this.addPlayer();

        this.addFloor();

        this.resize();
        this.setupResize();
        this.render();
    }

    addPlayer() {
        const player = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 'red' })
        )
        player.castShadow = true;
        this.scene.add(player);

        const bbox = new THREE.Box3().setFromObject(player);
        const bounds = {
            x: (bbox.max.x - bbox.min.x),
            y: (bbox.max.y - bbox.min.y),
            z: (bbox.max.z - bbox.min.z)
        }

        const playerPhysics = this.physics.player(bounds, player);
        this.controls = new PlayerControls(player, playerPhysics, this.camera, this.camDistance, this.lights);
    }

    addFloor() {
        this.floor = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50, 1, 1),
            new THREE.MeshBasicMaterial()
        );
        this.floor.receiveShadow = true;

        const grid = new THREE.GridHelper(50, 50);
        this.scene.add(grid);

        this.scene.add(this.floor);
        this.floor.rotateX(-Math.PI / 2);

        this.addFloorItems();
    }

    addFloorItems() {
        // this.loader.load("static/models/name.glb", (model) => {
        //     this.scene.add(model.scene);
        // });
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
        this.physics.update();

        if (this.controls) this.controls.update(this.clock.getDelta());

        // this.renderer.render(this.testScene, this.camera);
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this))
    }
}