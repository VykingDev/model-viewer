import { FileLoader, LoaderUtils, LoadingManager } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

export class VykingGLTFLoader extends GLTFLoader {
	constructor(manager?: LoadingManager) {
		super(manager)
	}

	bodyPart: string = 'footLeft'

	// load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined, onError?: ((event: ErrorEvent) => void) | undefined) {
	// 	const scope = this
	// 	let resourcePath: string

	// 	if (this.resourcePath !== '') {
	// 		resourcePath = this.resourcePath;
	// 	} else if (this.path !== '') {
	// 		resourcePath = this.path
	// 	} else {
	// 		resourcePath = LoaderUtils.extractUrlBase(url)
	// 	}

	// 	// Tells the LoadingManager to track an extra item, which resolves after
	// 	// the model is fully loaded. This means the count of items loaded will
	// 	// be incorrect, but ensures manager.onLoad() does not fire early.
	// 	this.manager.itemStart(url)

	// 	const _onError = function (e: ErrorEvent) {

	// 		if (onError) {
	// 			onError(e)
	// 		} else {
	// 			console.error(e);
	// 		}

	// 		scope.manager.itemError(url)
	// 		scope.manager.itemEnd(url)
	// 	}

	// 	const loader = new FileLoader(this.manager)

	// 	loader.setPath(this.path)
	// 	loader.setResponseType('arraybuffer')
	// 	loader.setRequestHeader(this.requestHeader)
	// 	loader.setWithCredentials(this.withCredentials)

	// 	loader.load(url, async (cypher) => {
	// 		try {
	// 			if (cypher instanceof ArrayBuffer && new Int32Array(cypher)[0] !== 0x46546C67) {
	// 				const ec = new TextEncoder()

	// 				const keyData = ec.encode('Pit3O9d:v2AqL.Ew1sgW6NXcrX=A5kFw')
	// 				// const iv = getRandomValues(new Uint8Array(16));
	// 				const iv = ec.encode('ao39xh239756/k5=')
	// 				const key = await crypto.subtle.importKey("raw", keyData, "AES-CBC", true, ["encrypt", "decrypt"])

	// 				// const encrypted = await crypto.subtle.encrypt({
	// 				// 	name: "AES-CBC",
	// 				// 	iv: iv,
	// 				// },
	// 				// 	key,
	// 				// 	cypher
	// 				// )
	// 				// const imageBlob = new Blob([encrypted], { type: 'model/gltf-binary' })
	// 				// const tempLink = document.createElement("a")
	// 				// tempLink.setAttribute('href', URL.createObjectURL(imageBlob));
	// 				// tempLink.setAttribute('download', `test.glb`);
	// 				// tempLink.click();
	// 				// URL.revokeObjectURL(tempLink.href)

	// 				const decrypted = await crypto.subtle.decrypt({
	// 					name: "AES-CBC",
	// 					iv: iv
	// 				},
	// 					key,
	// 					cypher
	// 				)

	// 				scope.parse(decrypted, resourcePath, function (gltf) {
	// 					onLoad(gltf)
	// 					scope.manager.itemEnd(url)
	// 				}, _onError)
	// 			} else {
	// 				scope.parse(cypher, resourcePath, function (gltf) {
	// 					onLoad(gltf)
	// 					scope.manager.itemEnd(url)
	// 				}, _onError)
	// 			}
	// 		} catch (e: any) {
	// 			_onError(e);
	// 		}
	// 	}, onProgress, _onError)
	// }

	load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined, onError?: ((event: ErrorEvent) => void) | undefined) {
		const loadGltf = (url: string, onLoad: (gltf: GLTF) => void, onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined, onError?: ((event: ErrorEvent) => void) | undefined) => {
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
	
			const _onError = function (e: ErrorEvent) {
	
				if (onError) {
					onError(e)
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
	
						const keyData = ec.encode('')
						// const iv = getRandomValues(new Uint8Array(16));
						const iv = ec.encode('')
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

		const loadFromOffsetsJson = (url: string, bodyPart: string, onLoad: (gltf: GLTF) => void, onProgress?: ((event: ProgressEvent<EventTarget>) => void) | undefined, onError?: ((event: ErrorEvent) => void) | undefined) => {
			console.log(`loadFromOffsetsJson ${this.resourcePath}`)

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
	
			const _onError = function (e: ErrorEvent) {
	
				if (onError) {
					onError(e)
				} else {
					console.error(e);
				}
	
				scope.manager.itemError(url)
				scope.manager.itemEnd(url)
			}
	
			const loader = new FileLoader(this.manager)
	
			loader.setPath(this.path)
			loader.setResponseType('text')
			loader.setRequestHeader(this.requestHeader)
			loader.setWithCredentials(this.withCredentials)
	
			loader.load(url, async (value) => {
				const isUrlAbsolute = (url: string) => (url.indexOf('://') > 0 || url.indexOf('//') === 0)
				const toResourceUrl = (url: string, resourcePath: string) => isUrlAbsolute(url) ? url : resourcePath + url 

				try {
					if (typeof value === 'string') {
						const json = JSON.parse(value)
						const glb_url = json[bodyPart]?.apparel[0]?.glb_uri

						loadGltf(toResourceUrl(glb_url, resourcePath), onLoad, onProgress, onError)
					}
				} catch (e: any) {
					_onError(e);
				}
			}, onProgress, _onError)
		}

		if (url.endsWith('.glb')) {
			return loadGltf(url, onLoad, onProgress, onError)
		} else {
			return loadFromOffsetsJson(url, this.bodyPart, onLoad, onProgress, onError)
		}
	}
}