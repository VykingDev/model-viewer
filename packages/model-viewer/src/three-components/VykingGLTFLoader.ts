import { FileLoader, LoaderUtils, LoadingManager } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

export class VykingGLTFLoader extends GLTFLoader {
	constructor(manager?: LoadingManager) {
		super(manager)
	}

	#key: string = 'Pit3O9d:v2AqL.Ew1sgW6NXcrX=A5kFw'
    #iv: string = 'ao39xh239756/k5='

	load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined, onError?: ((error: Error) => void) | undefined) {
		const scope = this
		let resourcePath: string

		if (this.resourcePath !== '') {
			resourcePath = this.resourcePath;
		} else if (this.path !== '') {
			resourcePath = this.path
		} else {
			resourcePath = LoaderUtils.extractUrlBase(url)
		}

		// Tells the LoadingManager to track an extra item, which resolves after
		// the model is fully loaded. This means the count of items loaded will
		// be incorrect, but ensures manager.onLoad() does not fire early.
		this.manager.itemStart(url)

		const _onError = function (e: unknown) {
			if (onError) {
				onError(e instanceof Error ? e : new Error('VykingGLTFLoader load error.'))
			} else {
				console.error(e);
			}

			scope.manager.itemError(url)
			scope.manager.itemEnd(url)
		}

		const loader = new FileLoader(this.manager)

		loader.setPath(this.path)
		loader.setResponseType('arraybuffer')
		loader.setRequestHeader(this.requestHeader)
		loader.setWithCredentials(this.withCredentials)

		loader.load(url, async (cypher) => {
			try {
				if (cypher instanceof ArrayBuffer && new Int32Array(cypher)[0] !== 0x46546C67) {
					const ec = new TextEncoder()

					const keyData = ec.encode(this.#key)
					// const iv = getRandomValues(new Uint8Array(16));
					const iv = ec.encode(this.#iv)
					const key = await crypto.subtle.importKey("raw", keyData, "AES-CBC", true, ["encrypt", "decrypt"])

					// const encrypted = await crypto.subtle.encrypt({
					// 	name: "AES-CBC",
					// 	iv: iv,
					// },
					// 	key,
					// 	cypher
					// )
					// const imageBlob = new Blob([encrypted], { type: 'model/gltf-binary' })
					// const tempLink = document.createElement("a")
					// tempLink.setAttribute('href', URL.createObjectURL(imageBlob));
					// tempLink.setAttribute('download', `test.glb`);
					// tempLink.click();
					// URL.revokeObjectURL(tempLink.href)

					const decrypted = await crypto.subtle.decrypt({
						name: "AES-CBC",
						iv: iv
					},
						key,
						cypher
					)

					scope.parse(decrypted, resourcePath, function (gltf) {
						onLoad(gltf)
						scope.manager.itemEnd(url)
					}, _onError)
				} else {
					scope.parse(cypher, resourcePath, function (gltf) {
						onLoad(gltf)
						scope.manager.itemEnd(url)
					}, _onError)
				}
			} catch (e: any) {
				_onError(e);
			}
		}, onProgress, _onError)
	}
}