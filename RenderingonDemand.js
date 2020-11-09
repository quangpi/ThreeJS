import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r122/build/three.module.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/controls/OrbitControls.js";
import { OBJLoader2 } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/OBJLoader2.js";
import { MTLLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/MTLLoader.js";
import { MtlObjBridge } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js";
import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r122/examples/jsm/loaders/GLTFLoader.js";
import { GUI } from "https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js";

function main() {
    const canvas = document.querySelector("#c");
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.shadowMap.enabled = true;
    const gui = new GUI();
    const fov = 45;
    const aspect = 2; // the canvas default
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("black");
    
    //nền
    {
        const planeSize = 40;

        const loader = new THREE.TextureLoader();
        const texture = loader.load("https://threejsfundamentals.org/threejs/resources/images/checker.png");
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.magFilter = THREE.NearestFilter;
        const repeats = planeSize / 2;
        texture.repeat.set(repeats, repeats);

        const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(planeGeo, planeMat);
        mesh.receiveShadow = true;
        mesh.rotation.x = Math.PI * -0.5;
        scene.add(mesh);
    }

    {
        const cubeSize = 30;
        const cubeGeo = new THREE.BoxBufferGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMat = new THREE.MeshPhongMaterial({
            color: "#CCC",
            side: THREE.BackSide,
        });
        const mesh = new THREE.Mesh(cubeGeo, cubeMat);
        mesh.receiveShadow = true;
        mesh.position.set(0, cubeSize / 2 - 0.1, 0);
        scene.add(mesh);
    }

    class ColorGUIHelper {
        constructor(object, prop) {
            this.object = object;
            this.prop = prop;
        }
        get value() {
            return `#${this.object[this.prop].getHexString()}`;
        }
        set value(hexString) {
            this.object[this.prop].set(hexString);
        }
    }

    function makeXYZGUI(gui, vector3, name, onChangeFn) {
        const folder = gui.addFolder(name);
        folder.add(vector3, "x", -10, 10).onChange(onChangeFn);
        folder.add(vector3, "y", 0, 10).onChange(onChangeFn);
        folder.add(vector3, "z", -10, 10).onChange(onChangeFn);
    }

    {
        const color = 0xffffff;
        const intensity = 1;
        const light = new THREE.PointLight(color, intensity);
        light.castShadow = true;
        light.position.set(0, 10, 0);
        scene.add(light);

        const helper = new THREE.PointLightHelper(light);
        scene.add(helper);

        function updateCamera() {}

        class MinMaxGUIHelper {
            constructor(obj, minProp, maxProp, minDif) {
                this.obj = obj;
                this.minProp = minProp;
                this.maxProp = maxProp;
                this.minDif = minDif;
            }
            get min() {
                return this.obj[this.minProp];
            }
            set min(v) {
                this.obj[this.minProp] = v;
                this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
            }
            get max() {
                return this.obj[this.maxProp];
            }
            set max(v) {
                this.obj[this.maxProp] = v;
                this.min = this.min;
            }
        }

        class FogGUIHelper {
            constructor(fog, backgroundColor) {
                this.fog = fog;
                this.backgroundColor = backgroundColor;
            }
            get near() {
                return this.fog.near;
            }
            set near(v) {
                this.fog.near = v;
                this.fog.far = Math.max(this.fog.far, v);
            }
            get far() {
                return this.fog.far;
            }
            set far(v) {
                this.fog.far = v;
                this.fog.near = Math.min(this.fog.near, v);
            }
            get color() {
                return `#${this.fog.color.getHexString()}`;
            }
            set color(hexString) {
                this.fog.color.set(hexString);
                this.backgroundColor.set(hexString);
            }
        }

        //Gắn intensity, distance
        gui.addColor(new ColorGUIHelper(light, "color"), "value").name("color");
        gui.add(light, "intensity", 0, 2, 0.01);
        gui.add(light, "distance", 0, 40).onChange(updateCamera);

        //Gắn Shadow Camera
        {
            const folder = gui.addFolder("Shadow Camera");
            folder.open();
            const minMaxGUIHelper = new MinMaxGUIHelper(light.shadow.camera, "near", "far", 0.1);
            folder.add(minMaxGUIHelper, "min", 0.1, 50, 0.1).name("near").onChange(updateCamera);
            folder.add(minMaxGUIHelper, "max", 0.1, 50, 0.1).name("far").onChange(updateCamera);
        }

        makeXYZGUI(gui, light.position, "Position", updateCamera);
        
        //Gắn Fog
        {
            const folder = gui.addFolder("Fog");
            folder.open();
            const near = 1;
            const far = 51;
            const color = "lightblue";
            scene.fog = new THREE.Fog(color, near, far);
            scene.background = new THREE.Color(color);

            const fogGUIHelper = new FogGUIHelper(scene.fog, scene.background);
            gui.add(fogGUIHelper, "near", near, far).listen();
            gui.add(fogGUIHelper, "far", near, far).listen();
            gui.addColor(fogGUIHelper, "color");
        }
    }

    //add shadows for file gltf
    let cars;
    let carsSize = 0;
    {
        const gltfLoader = new GLTFLoader();
        gltfLoader.load("./q/scene.gltf", (gltf) => {
            gltf.scene.traverse(function (node) {
                if (node.isMesh) {
                    node.castShadow = true;
                }
            });
            scene.add(gltf.scene);
            cars = gltf.scene;
            cars.position.set(-carsSize - 1, carsSize + 5, 0);
        });
    }

    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        if (cars) {
            cars.rotation.y = time;
        }

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
