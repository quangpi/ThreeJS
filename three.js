import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r119/build/three.module.js";
                import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/controls/OrbitControls.js";
                import { OBJLoader2 } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/OBJLoader2.js";
                import { MTLLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/MTLLoader.js";
                import { MtlObjBridge } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/obj2/bridge/MtlObjBridge.js";
                import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r119/examples/jsm/loaders/GLTFLoader.js";
                import { GUI } from "https://threejsfundamentals.org/threejs/../3rdparty/dat.gui.module.js";
                function main() {
                    const canvas = document.querySelector("#c");
                    const renderer = new THREE.WebGLRenderer({ canvas });
                    renderer.physicallyCorrectLight = true;
                    const fov = 45;
                    const aspect = 2;
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
                        const planeSize = 20;
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
                        mesh.rotation.x = Math.PI * -0.5;
                        scene.add(mesh);
                    }

                    //Bảng chỉnh độ sáng
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
                    //tạo hàm vị trí light và target
                    function makeXYZGUI(gui, vector3, name, onChangeFn) {
                        const folder = gui.addFolder(name);
                        folder.add(vector3, "x", -10, 10).onChange(onChangeFn);
                        folder.add(vector3, "y", 0, 10).onChange(onChangeFn);
                        folder.add(vector3, "z", -10, 10).onChange(onChangeFn);
                        folder.open();
                    }

                    //add light
                    {
                        const color = 0xffffff;
                        const intensity = 1;
                        const light = new THREE.PointLight(color, intensity);
                        light.power = 20;
                        light.distance = Infinity;
                        light.position.set(0, 10, 0);
                        scene.add(light);

                        const helper = new THREE.PointLightHelper(light);
                        scene.add(helper);

                        const gui = new GUI();
                        gui.addColor(new ColorGUIHelper(light, "color"), "value").name("color");
                        gui.add(light, "power", 0, 1120, 0.01);

                        //Di chuyển light và target
                        makeXYZGUI(gui, light.position, "position");
                    }

                    let cars;
                    {
                        const gltfLoader = new GLTFLoader();
                        gltfLoader.load("./q/scene.gltf", function (gltf) {
                            const root = gltf.scene;
                            scene.add(root);
                            cars = root;

                            const box = new THREE.Box3().setFromObject(root);

                            const boxSize = box.getSize(new THREE.Vector3()).length();
                            const boxCenter = box.getCenter(new THREE.Vector3());

                            frameArea(boxSize * 1.5, boxSize, boxCenter, camera);

                            controls.maxDistance = boxSize * 10;
                            controls.target.copy(boxCenter);
                            controls.update();
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
                            //  cars.rotation.x = time;
                        }

                        renderer.render(scene, camera);

                        requestAnimationFrame(render);
                    }

                    requestAnimationFrame(render);
                }

                main();