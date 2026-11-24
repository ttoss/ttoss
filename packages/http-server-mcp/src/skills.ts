// The MCP Skills extension (io.modelcontextprotocol/skills), served as the SDK
// implements it: createMcpRouter needs nothing of its own to carry it.
export {
  memorySkillFiles,
  type Skill,
  SkillCatalog,
  type SkillCatalogChanges,
  type SkillCatalogOptions,
  type SkillFiles,
  SKILLS_EXTENSION_ID,
  SkillsExtension,
  type SkillSource,
} from '@modelcontextprotocol/server/ext/skills';
export { nodeSkillFiles } from '@modelcontextprotocol/server/ext/skills/node';
