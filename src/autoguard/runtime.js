import { DEFAULT_CONFIG } from "./config.js";
import { createAutoGuardService } from "./service.js";
import { createPersistence } from "./persistence.js";
let singleton;
export function getAutoGuardRuntime({configRepository,playerModerationRequest}={}){
 if(singleton)return singleton;
 const persistence=createPersistence(configRepository);
 const config=persistence.load({...DEFAULT_CONFIG});
 const service=createAutoGuardService({config,moderationApi:playerModerationRequest});
 singleton={...service,get config(){return {...service.autoGuard.config};},updateConfig(patch){service.autoGuard.updateConfig(patch);persistence.save(service.autoGuard.config);},dispose(){service.dispose();singleton=undefined;}};
 return singleton;
}
