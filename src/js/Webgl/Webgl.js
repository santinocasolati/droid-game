import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import CannonDebugger from "cannon-es-debugger";
import gsap from "gsap";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

class PlayerControls {
    constructor(vehicle, playerArray, camDistance, camera) {
        this.vehicle = vehicle;
        this.playerArray = playerArray;
        this.camDistance = camDistance;
        this.camera = camera;

        this.init();
    }

    init() {
        this.addListeners();
    }

    addListeners() {
        this.keysPressed = {
            up: false,
            down: false,
            right: false,
            left: false
        }

        document.addEventListener("keydown", (e) => {
            const key = e.key.toLowerCase();

            switch (key) {
                case "w":
                case "arrowup":
                    this.keysPressed.up = true;
                    break;

                case "a":
                case "arrowleft":
                    this.keysPressed.left = true;
                    break;

                case "s":
                case "arrowdown":
                    this.keysPressed.down = true;
                    break;

                case "d":
                case "arrowright":
                    this.keysPressed.right = true;
                    break;

                default:
                    break;
            }
        });

        document.addEventListener("keyup", (e) => {
            const key = e.key.toLowerCase();

            switch (key) {
                case "w":
                case "arrowup":
                    this.keysPressed.up = false;
                    break;

                case "a":
                case "arrowleft":
                    this.keysPressed.left = false;
                    break;

                case "s":
                case "arrowdown":
                    this.keysPressed.down = false;
                    break;

                case "d":
                case "arrowright":
                    this.keysPressed.right = false;
                    break;

                default:
                    break;
            }
        });
    }

    update() {
        const maxSteerVal = Math.PI / 8;
        const maxForce = 10;

        let direction = 0;

        if (this.keysPressed.up || this.keysPressed.down) {
            if (this.keysPressed.up && this.keysPressed.down) {
                this.vehicle.setWheelForce(0, 2);
                this.vehicle.setWheelForce(0, 3);
            } else {
                if (this.keysPressed.up) {
                    this.vehicle.setWheelForce(-maxForce, 2);
                    this.vehicle.setWheelForce(-maxForce, 3);
                } else {
                    if (this.keysPressed.down) {
                        this.vehicle.setWheelForce(maxForce, 2);
                        this.vehicle.setWheelForce(maxForce, 3);
                    }
                }
            }
        } else {
            this.vehicle.setWheelForce(0, 2);
            this.vehicle.setWheelForce(0, 3);
        }

        if (this.keysPressed.left || this.keysPressed.right) {
            if (this.keysPressed.left && this.keysPressed.right) {
                this.vehicle.setSteeringValue(0, 2);
                this.vehicle.setSteeringValue(0, 3);
            } else {
                if (this.keysPressed.left) {
                    this.vehicle.setSteeringValue(maxSteerVal, 2);
                    this.vehicle.setSteeringValue(maxSteerVal, 3);
                    direction = 0.2;
                } else {
                    if (this.keysPressed.right) {
                        this.vehicle.setSteeringValue(-maxSteerVal, 2);
                        this.vehicle.setSteeringValue(-maxSteerVal, 3);
                        direction = -0.2;
                    }
                }
            }
        } else {
            this.vehicle.setSteeringValue(0, 2);
            this.vehicle.setSteeringValue(0, 3);
        }

        this.playerArray[0].position.x = this.playerArray[1].position.x;
        this.playerArray[0].position.y = this.playerArray[1].position.y - 0.9;
        this.playerArray[0].position.z = this.playerArray[1].position.z;
        this.playerArray[0].quaternion.copy(this.playerArray[1].quaternion);

        gsap.to(this.playerArray[0].children[0].children[3].rotation, { y: -direction });
        gsap.to(this.playerArray[0].children[0].children[4].rotation, { y: direction });

        this.camera.position.x = this.playerArray[0].position.x + this.camDistance.x;
        this.camera.position.z = this.playerArray[0].position.z + this.camDistance.z;
    }
}

class Physics {
    constructor(testScene) {
        this.testScene = testScene;

        this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

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
        this.wheelMaterial = new CANNON.Material("wheel");

        const wheelContact = new CANNON.ContactMaterial(
            this.groundMaterial,
            this.wheelMaterial,
            {
                friction: 1,
                restitution: 0
            }
        );

        this.world.addContactMaterial(wheelContact);
    }

    ground() {
        const groundBody = new CANNON.Body({
            type: CANNON.Body.STATIC,
            shape: new CANNON.Plane(),
            material: this.groundMaterial
        });

        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
    }

    car(bounds, mesh) {
        const carBody = new CANNON.Body({
            mass: 10,
            position: new CANNON.Vec3(0, 1, 0),
            shape: new CANNON.Box(new CANNON.Vec3(bounds.x * 0.5, bounds.y / 4, bounds.z * 0.5))
        });

        this.vehicle = new CANNON.RigidVehicle({
            chassisBody: carBody
        });

        const mass = 1;
        const axisWidth = 2;
        const wheelShape = new CANNON.Sphere(0.7);

        const down = new CANNON.Vec3(0, -1, 0);

        const wheelBody1 = new CANNON.Body({ mass, material: this.wheelMaterial });
        wheelBody1.addShape(wheelShape);
        wheelBody1.angularDamping = 0.8;
        this.vehicle.addWheel({
            body: wheelBody1,
            position: new CANNON.Vec3(-0.95, -0.25, axisWidth / 2),
            axis: new CANNON.Vec3(0, 0, 1),
            direction: down
        });

        const wheelBody2 = new CANNON.Body({ mass, material: this.wheelMaterial });
        wheelBody2.addShape(wheelShape);
        wheelBody2.angularDamping = 0.8;
        this.vehicle.addWheel({
            body: wheelBody2,
            position: new CANNON.Vec3(-0.95, -0.25, -axisWidth / 2),
            axis: new CANNON.Vec3(0, 0, 1),
            direction: down
        });

        const wheelBody3 = new CANNON.Body({ mass, material: this.wheelMaterial });
        wheelBody3.addShape(wheelShape);
        wheelBody3.angularDamping = 0.8;
        this.vehicle.addWheel({
            body: wheelBody3,
            position: new CANNON.Vec3(0.6, -0.25, axisWidth / 2),
            axis: new CANNON.Vec3(0, 0, 1),
            direction: down
        });

        const wheelBody4 = new CANNON.Body({ mass, material: this.wheelMaterial });
        wheelBody4.addShape(wheelShape);
        wheelBody4.angularDamping = 0.8;
        this.vehicle.addWheel({
            body: wheelBody4,
            position: new CANNON.Vec3(0.6, -0.25, -axisWidth / 2),
            axis: new CANNON.Vec3(0, 0, 1),
            direction: down
        });

        this.vehicle.addToWorld(this.world);

        const playerArray = [mesh, carBody, [wheelBody1, wheelBody2, wheelBody3, wheelBody4], bounds];

        return {
            pa: playerArray,
            veh: this.vehicle
        };
    }

    update() {
        this.world.fixedStep();
        this.debugger.update();
    }
}

export default class Webgl {
    constructor(options) {
        this.container = options.domElement;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
        this.camDistance = new THREE.Vector3(0, 8, 13);
        this.camera.position.copy(this.camDistance);
        this.camera.lookAt(0, 0, 0);

        this.scene = new THREE.Scene();
        this.testScene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();
        this.loader = new GLTFLoader();

        this.physics = new Physics(this.testScene);

        this.init();
    }

    init() {
        this.addCar();

        this.addFloor();

        this.lights();

        this.resize();
        this.setupResize();
        this.render();
    }

    addCar() {
        this.loader.load("static/models/raceFuture.glb", (model) => {
            this.scene.add(model.scene);
            // this.testScene.add(model.scene);

            const bbox = new THREE.Box3().setFromObject(model.scene);
            const bounds = {
                x: (bbox.max.x - bbox.min.x),
                y: (bbox.max.y - bbox.min.y),
                z: (bbox.max.z - bbox.min.z)
            }

            const controlItems = this.physics.car(bounds, model.scene);
            this.controls = new PlayerControls(controlItems.veh, controlItems.pa, this.camDistance, this.camera);
        });
    }

    addFloor() {
        this.floor = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100, 1, 1),
            new THREE.MeshStandardMaterial()
        );

        const grid = new THREE.GridHelper(100, 100);
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

    lights() {
        this.lightGroup = new THREE.Group();

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLightUp = new THREE.DirectionalLight(0xffffff, 5);
        directionalLightUp.position.set(0, 10, 0);
        this.lightGroup.add(directionalLightUp);

        const directionalLightLeft = new THREE.DirectionalLight(0xffffff, 5);
        directionalLightLeft.position.set(-10, 0, 0);
        this.lightGroup.add(directionalLightLeft);

        const directionalLightRight = new THREE.DirectionalLight(0xffffff, 5);
        directionalLightRight.position.set(10, 0, 0);
        this.lightGroup.add(directionalLightRight);

        const directionalLightFront = new THREE.DirectionalLight(0xffffff, 5);
        directionalLightFront.position.set(0, 0, 10);
        this.lightGroup.add(directionalLightFront);

        const directionalLightBack = new THREE.DirectionalLight(0xffffff, 5);
        directionalLightBack.position.set(0, 0, -10);
        this.lightGroup.add(directionalLightBack);

        this.scene.add(this.lightGroup);
        // this.testScene.add(this.lightGroup);
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

        if (this.controls) this.controls.update();

        // this.renderer.render(this.testScene, this.camera);
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this))
    }
}