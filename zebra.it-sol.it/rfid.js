/*
*		---NOTES---
*
* tagEvent is used for multiple operations and thus should be reassigned before doing any operation
*
*/


/**
 * @callback onInventoryEvent
 * @param {object[]} tags - individual tags found
 * @param {object[]} reads - last 50 reads
 */

/**
 * @callback onTagLocateEvent
 * @param {number} distance - the distance between the reader and the tag, goes from 0 to 100
 */

/**
 * @callback onScanSingleRfidEvent
 * @param {object} tag - tag found
 */

//definitions
let onTagEvent = ()=>{}
let onSingleScanEvent = ()=>{}



window.statusHandler = status=>{
	console.log("status", status);
	if(status.errorCode != 1000){
		console.error("ERROR WITH CODE"+status.errorCode	 + "\n" + status.method + " "+status.vendorMessage)
		
		//HORRIBLE FIX PARTE UNO
		//RIMUOVERE IL PRIMA POSSIBILE
		window.location.reload()
	}
}

const singleScanOpt = {
	stopTriggerType: "tagObservation",
	stopObservationCount: 1
}

const performInventoryOpt = {
	stopTriggerType: "duration",
	stopObservationCount: 10000000
}

export let scriptOptions = {
	deps: ["ebapi-modules", "elements"],
	path: "",
	folderName: "zebra.it-sol.it/"
} 

/**
 * 
 * @param {object} props - rfid object properties
 *
 * use effect highly recommended
 * 
 * for the list of parameters see official zebra documentation: https://techdocs.zebra.com/enterprise-browser/3-3/api/re2x/rfid/
 */
export const setProperties = props=>{
	const interInit = setInterval(()=>{
		if(rfid){
			
			init()
			rfid = Object.assign(rfid, props)
			clearInterval(interInit)
		}
	}, 300) 
}

const GET_PATH = ()=>scriptOptions.path+scriptOptions.folderName


 const script = ()=>{
	let interInit
    const d = scriptOptions.deps.shift()
	const po = document.createElement('script');
	po.type = 'text/javascript';
	po.async = false
	po.id = d+"_script"
    po.defer = false
	po.src = GET_PATH()+'zebralib/'+d+'.js'
	const s = document.getElementsByTagName('script')[0]
	if(!document.getElementById(po.id))
		s.parentNode.insertBefore(po, s);
		if(scriptOptions.deps.at(0)) script(scriptOptions.deps.at(0))	
	else
	{ interInit = setInterval(()=>{
			if(rfid){
				init()
				clearInterval(interInit)	
			}
		}, 300)}
	}


const inventoryData = {
	tags: [],
	reads: new Array(50),
	chunk: function(newChunk){this.reads = new Array(newChunk)},
	addTag: function(newTag){
		const condition = this.tags.find(e=>e.tagID === newTag.tagID)
		if(condition) return
		this.tags.push(newTag)		
	}
}

window.scanSingleRfidHandler = dataArray=>{
	onSingleScanEvent(dataArray.TagData.at(0))
	rfid.stop() 
}

window.inventoryHandler = dataArray=>{
	dataArray.TagData.forEach(e=>{
		inventoryData.addTag(e)
		inventoryData.reads.pop()
		inventoryData.reads.unshift(e)
	})
	const {tags, reads} = inventoryData
	onTagEvent(tags, reads)
}



function init(){
	rfid.stop()
	defaultProperties()
	rfid.statusEvent = "statusHandler(%json);"
		//non rimuovere
	getReader()
}

function getReader(){
	onEnumerate(readers=>{
		console.log("readers found", readers);
		rfid.readerID = readers[0][0]
		console.log(readers[0][0]);
	})
	rfid.enumerate()
	rfid.connect()
}

function defaultProperties(){
	setProperties({
		beepOnRead: 1,
		transport: "serial"
	})
}

/**
 * Calls "onEnumerate" callback function and returns the number of rfid scanners
 * @returns {number} number of rfid scanners found
 */
export const enumerate = ()=>rfid.enumerate()

/**
 * disconnects current rfid reader
 * 
 * WARNING: when no rfid reader is connected the program
 * may crash when starting an rfid operation
 */
export const disconnect = ()=>rfid.disconnect()

/**
 * @function
 * @param {function} callback - function that gets called during "enumerate()" execution
*/
export const onEnumerate = (callback)=>{
	rfid.stop()
	window.enumRfid = callback
	rfid.enumRFIDEvent = "enumRfid(%s);"
}

/**
 * locates tag
 * @param {onTagLocateEvent} callback - function called when locating a tag 
*/
export const onTagLocate = (callback)=>{
	window.tagLocateHandler = callback
}

/**
 * locates a tag with the given rfid
*/
export const locateTag = (tagId) =>{
	rfid.stop()
	rfid.tagEvent = "tagLocateHandler(%json);"
    rfid.antennaSelected = 1;
    rfid.tagID = tagId
    rfid.locateTag();
}



/**
 * performs inventory and triggers tagEvent
*/
export function startInventory(){
	rfid.stop()
	//setting options
	rfid.stopTriggerType = performInventoryOpt.stopTriggerType
	rfid.stopObservationCount = performInventoryOpt.stopObservationCount

	rfid.tagEvent = "inventoryHandler(%json);"
	rfid.performInventory()
}

/***
 * @function
 * stops current operation
 */
export const stop = ()=>rfid.stop()

/**
 * @function
 * @param {onInventoryEvent} callback - function that gets called during "startInventory()" execution
 */
export const onInventory = (callback)=>{
	onTagEvent = callback
}

export const scanSingleRfid = ()=>{

	//setting options
	rfid.stopTriggerType = singleScanOpt.stopTriggerType
	rfid.stopObservationCount = singleScanOpt.stopObservationCount
	rfid.tagEvent = "scanSingleRfidHandler(%json);"
	rfid.performInventory()
}

/**
 * @param {onScanSingleRfidEvent} callback - function that gets called during "scanSingleRfid" operation
 */
export const onScanSingleRfid = callback=>{
	onSingleScanEvent = callback
}


//leave at the bottom
script()


//HORRBILE FIX PARTE DUE
//RIMUOVERE IL PRIMA POSSIBILE
setInterval(()=>{
	window.statusHandler = status=>{
		console.log(status);
		if(status.errorCode != 1000){
			console.error(status.vendorMessage)
		}
	}
}, 500)
