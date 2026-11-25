import {describe,it,expect} from "vitest";
import {ThreatMonitor} from "../src/autoguard/threatMonitor.js";
describe("ThreatMonitor",()=>{
 it("does not flag a single join",()=>{const m=new ThreatMonitor();expect(m.record("usr_demo","join",1000)).toBeNull();});
 it("marks repeated leave/join as review-only",()=>{const m=new ThreatMonitor();m.record("usr_demo","join",1000);m.record("usr_demo","leave",2000);m.record("usr_demo","join",3000);m.record("usr_demo","leave",4000);const a=m.record("usr_demo","join",5000);expect(a?.code).toBe("repeated-rejoin");expect(a?.severity).toBe("review");});
});
