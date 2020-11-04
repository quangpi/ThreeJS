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
        //Gắn intensity, distance

        const gui = new GUI();

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
        makeXYZGUI(gui, light.position, "position", updateCamera);

        //Gắn Fog
        {
            const folder = gui.addFolder("Fog");
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

    {
        // const color = 0xFFFFFF;
        // const intensity = 1;
        // const light = new THREE.DirectionalLight(color, intensity);
        // light.position.set(-1, 2, 4);
        // scene.add(light);
    }

    const geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3(-2, -2, 2), // 0
        new THREE.Vector3(1, -1, 1), // 1
        new THREE.Vector3(-1, 1, 1), // 2
        new THREE.Vector3(1, 1, 1), // 3
        new THREE.Vector3(-1, -1, -1), // 4
        new THREE.Vector3(1, -1, -1), // 5
        new THREE.Vector3(-1, 1, -1), // 6
        new THREE.Vector3(5, 5, -5) // 7
    );

    /*
         6----7
        /|   /|
       2----3 |
       | |  | |
       | 4--|-5
       |/   |/
       0----1
    */
    //Ngược chiều kim đồng hồ
    geometry.faces.push(
        // front
        new THREE.Face3(0, 3, 2),
        new THREE.Face3(0, 1, 3),
        // right
        new THREE.Face3(1, 7, 3),
        new THREE.Face3(1, 5, 7),
        // back
        new THREE.Face3(5, 6, 7),
        new THREE.Face3(5, 4, 6),
        // left
        new THREE.Face3(4, 2, 6),
        new THREE.Face3(4, 0, 2),
        // top
        new THREE.Face3(2, 7, 6),
        new THREE.Face3(2, 3, 7),
        // bottom
        new THREE.Face3(4, 1, 0),
        new THREE.Face3(4, 5, 1)
    );

    geometry.faceVertexUvs[0].push(
        // front
        [new THREE.Vector2(1, 1), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)],
        [new THREE.Vector2(1, 1), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)],
        // right
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)],
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)],
        // back
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)],
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)],
        // left
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)],
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)],
        // top
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)],
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)],
        // bottom
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)],
        [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)]
    );

    //Mỗi mặt một màu
    geometry.faces[0].color = geometry.faces[1].color = new THREE.Color("red");
    geometry.faces[2].color = geometry.faces[3].color = new THREE.Color("yellow");
    geometry.faces[4].color = geometry.faces[5].color = new THREE.Color("green");
    geometry.faces[6].color = geometry.faces[7].color = new THREE.Color("cyan");
    geometry.faces[8].color = geometry.faces[9].color = new THREE.Color("blue");
    geometry.faces[10].color = geometry.faces[11].color = new THREE.Color("magenta");

    //Đặt mỗi mặt ba màu
    geometry.faces.forEach((face, ndx) => {
        face.vertexColors = [new THREE.Color().setHSL(ndx / 12, 1, 0.5), new THREE.Color().setHSL(ndx / 12 + 0.1, 1, 0.5), new THREE.Color().setHSL(ndx / 12 + 0.2, 1, 0.5)];
    });

    geometry.computeFaceNormals();
    const loader = new THREE.TextureLoader();
    const texture = loader.load("https://threejsfundamentals.org/threejs/resources/images/star.png");

    //chạy lệnh. vertexColors: THREE.VertexColors: mỗi mặt ba màu
    function makeInstance(geometry, color, x, y) {
        const material = new THREE.MeshBasicMaterial({ color, map: texture, vertexColors: THREE.VertexColors });

        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        //Bóng hình
        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.position.x = x * 4;
        cube.position.y = y;
        return cube;
    }
    //Vị trí hộp
    const cubes = [makeInstance(geometry, 0x44ff44, 0, 5), makeInstance(geometry, 0x4444ff, -2, 5), makeInstance(geometry, 0xff4444, 2, 5)];

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
        // if(cars) {
        //cars.rotation.y = time;
        // }

        resizeRendererToDisplaySize(renderer);

        {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
