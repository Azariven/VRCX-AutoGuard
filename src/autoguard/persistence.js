const KEY="vrcx.autoguard.config";
export function createPersistence(repository){
 return { load(fallback={}){try{const raw=repository?.getString?.(KEY);return raw?{...fallback,...JSON.parse(raw)}:fallback;}catch{return fallback;}}, save(config){if(!repository?.setString)throw new Error("VRCX configRepository unavailable");repository.setString(KEY,JSON.stringify(config));} };
}
