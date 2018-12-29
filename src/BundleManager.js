'use strict';

const fs = require('fs'),
      path = require('path'),
      chalk = require('chalk'),
      Data = require('./Data'),
      Area = require('./Area'),
      Command = require('./Command'),
      Room = require('./Room'),
      Skill = require('./Skill'),
      SkillType = require('./SkillType'),
      Aspect = require('./Aspect'),
      Helpfile = require('./Helpfile'),
      Logger = require('./Logger')

const srcPath = __dirname + '/';
const bundlesPath = srcPath + '../bundles/';

/**
 * Keep track of all bundles
 * @property {GameState} state
 */
class BundleManager {
  constructor(state) {
    this.state = state;
  }

  /**
   * Load content from all bundles
   * @param {?boolean} distribute Whether to distribute the loaded bundles into game state
   */
  loadBundles(distribute = true) {
    Logger.log(`${chalk.bold.red.underline('LOADING BUNDLES...')}`);

    // for each bundle folder
    const bundles = fs.readdirSync(bundlesPath);
    for (const bundle of bundles) {
      const bundlePath = bundlesPath + bundle;
      if (fs.statSync(bundlePath).isFile() || bundle === '.' || bundle === '..') {
        continue;
      }

      // only load bundles in config
      if (this.state.Config.get('bundles', []).indexOf(bundle) === -1) {
        continue;
      }

      this.loadBundle(bundle, bundlePath);
    }

    Logger.log(`${chalk.bold.red.underline('BUNDLES LOADED!')}`);

    // if not distributing the loaded bundles into game state, return
    if (!distribute) {
      return;
    }

    // in case one area references another, distribution is done after all areas are loaded
    this.state.AreaManager.distribute(this.state);

    // load the starting room from config
    this.state.RoomManager.startingRoom = this.state.RoomManager.getRoom(this.state.Config.get('startingRoom'));
    if (!this.state.RoomManager.startingRoom) {
      throw new Error('You must define a valid starting room in pinwheel.json');
    }
    Logger.log(`${chalk.bold.yellow('CONFIG')}${chalk.bold.white(':')} starting room is ${chalk.bold.magenta(this.state.RoomManager.startingRoom.entityReference)}`);

    // load the intro event from config
    if (!this.state.Config.get('introEvent', false)) {
      throw new Error('You must define an intro event in pinwheel.json');
    }
    Logger.log(`${chalk.bold.yellow('CONFIG')}${chalk.bold.white(':')} intro event is ${chalk.bold.magenta(this.state.Config.get('introEvent'))}`);
  }

  /**
   * Load content from a specific bundle
   * @param {string} bundle Bundle name
   * @param {string} bundlePath Path to bundle directory
   */
  loadBundle(bundle, bundlePath) {
    const features = [
      // TIP: quest goals and rewards must be loaded before areas that have quests
      { path: 'quest-goals/', fn: 'loadQuestGoals' },
      { path: 'quest-rewards/', fn: 'loadQuestRewards' },
      { path: 'behaviors/', fn: 'loadBehaviors' },
      { path: 'areas/', fn: 'loadAreas' },
      { path: 'commands/', fn: 'loadCommands' },
      { path: 'help/', fn: 'loadHelp' },
      { path: 'effects/', fn: 'loadEffects' },
      { path: 'skills/', fn: 'loadSkills' },
      { path: 'species/', fn: 'loadSpecies' },
      { path: 'archetypes/', fn: 'loadArchetypes' },
      { path: 'traits/', fn: 'loadTraits' },
      { path: 'input-events/', fn: 'loadInputEvents' },
      { path: 'server-events/', fn: 'loadServerEvents' },
      { path: 'channels.js', fn: 'loadChannels' },
      { path: 'player-events.js', fn: 'loadPlayerEvents' },
    ];

    Logger.verbose(`${chalk.bold.red('START')}${chalk.bold.white(': BUNDLE')} ${chalk.bold.yellow(bundle)}...`);
    for (const feature of features) {
      const path = bundlePath + '/' + feature.path;
      if (fs.existsSync(path)) {
        this[feature.fn](bundle, path);
      }
    }

    Logger.verbose(`${chalk.bold.red('DONE')}${chalk.bold.white(': BUNDLE')} ${chalk.bold.yellow(bundle)}`);
  }

  /**
   * Load quest goal definitions from a bundle
   * @param {string} bundle Bundle name
   * @param {string} goalsDir Path to quest goals directory
   */
  loadQuestGoals(bundle, goalsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': QUEST GOALS...')}`);
    const files = fs.readdirSync(goalsDir);

    for (const goalFile of files) {
      const goalPath = goalsDir + goalFile;
      if (!Data.isScriptFile(goalPath, goalFile)) {
        continue;
      }

      const goalName = path.basename(goalFile, path.extname(goalFile));
      const loader = require(goalPath);
      let goalImport = loader(srcPath);
      Logger.verbose(`\t\t${chalk.bold.cyan(goalName)}`);

      this.state.QuestGoalManager.set(goalName, goalImport);
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': QUEST GOALS')}`);
  }

  /**
   * Load quest reward definitions from a bundle
   * @param {string} bundle Bundle name
   * @param {string} rewardsDir Path to quest rewards directory
   */
  loadQuestRewards(bundle, rewardsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': QUEST REWARDS...')}`);
    const files = fs.readdirSync(rewardsDir);

    for (const rewardFile of files) {
      const rewardPath = rewardsDir + rewardFile;
      if (!Data.isScriptFile(rewardPath, rewardFile)) {
        continue;
      }

      const rewardName = path.basename(rewardFile, path.extname(rewardFile));
      const loader = require(rewardPath);
      let rewardImport = loader(srcPath);
      Logger.verbose(`\t\t${chalk.bold.cyan(rewardName)}`);

      this.state.QuestRewardManager.set(rewardName, rewardImport);
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': QUEST REWARDS')}`);
  }

  /**
   * Load behaviors from a bundle
   * @param {string} bundle Bundle name
   * @param {string} behaviorsDir Path to behaviors directory
   */
  loadBehaviors(bundle, behaviorsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': BEHAVIORS...')}`);

    this.loadEntityBehaviors('npc', this.state.NpcBehaviorManager, behaviorsDir, this.state);
    this.loadEntityBehaviors('item', this.state.ItemBehaviorManager, behaviorsDir, this.state);
    this.loadEntityBehaviors('room', this.state.RoomBehaviorManager, behaviorsDir, this.state);
    this.loadEntityBehaviors('area', this.state.AreaBehaviorManager, behaviorsDir, this.state);

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': BEHAVIORS')}`);
  }

  /**
   * Load all of one behavior type from a bundle
   * TIP: behaviors are classified by entities (NPCs, items, rooms, areas)
   * @param {string} type Name of behavior type
   * @param {*} manager Manager to hold the behavior type
   * @param {string} behaviorsDir Path to behaviors directory
   * @param {GameState} state Game state
   */
  loadEntityBehaviors(type, manager, behaviorsDir, state) {
    let typeDir = behaviorsDir + type + '/';

    if (!fs.existsSync(typeDir)) {
      return;
    }

    const printType = `: ${type.toUpperCase()} BEHAVIORS...`
    Logger.verbose(`\t\t${chalk.bold.green('START')}${chalk.bold.white(printType)}`);
    const files = fs.readdirSync(typeDir);

    for (const behaviorFile of files) {
      const behaviorPath = typeDir + behaviorFile;
      if (!Data.isScriptFile(behaviorPath, behaviorFile)) {
        continue;
      }

      const behaviorName = path.basename(behaviorFile, path.extname(behaviorFile));
      Logger.verbose(`\t\t\t${chalk.bold.cyan(behaviorName)}`);
      const behaviorListeners = require(behaviorPath)(srcPath).listeners;

      for (const [eventName, listener] of Object.entries(behaviorListeners)) {
        manager.addListener(behaviorName, eventName, listener(state));
      }
    }
  }

  /**
   * Load area definitions from a bundle
   * @param {string} bundle Bundle name
   * @param {string} areasDir Path to areas directory
   */
  loadAreas(bundle, areasDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': AREAS...')}`);

    const dirs = fs.readdirSync(areasDir);

    for (const areaDir of dirs) {
      if (fs.statSync(areasDir + areaDir).isFile()) {
        continue;
      }

      const areaPath = areasDir + areaDir;
      const areaName = path.basename(areaDir);
      let area = this.loadArea(bundle, areaName, areaPath);
      this.state.AreaManager.addArea(area);
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': AREAS')}`);
  }

  /**
   * Load a specific area's definitions from a bundle
   * @param {string} bundle Bundle name
   * @param {string} areaName Name of area
   * @param {string} areaPath Path to area's directory
   */
  loadArea(bundle, areaName, areaPath) {
    // define the directory structure to load
    const paths = {
      manifest: areaPath + '/manifest.yml',
      rooms: areaPath + '/rooms.yml',
      items: areaPath + '/items.yml',
      npcs: areaPath + '/npcs.yml',
      quests: areaPath + '/quests.yml',
    };

    // parse the manifest file (default yaml config for area)
    const manifest = Data.parseFile(paths.manifest);

    // create the area
    const area = new Area(bundle, areaName, manifest);

    Logger.verbose(`\t\t${chalk.bold.yellow.underline(areaName)}`);

    // TIP: quests must be loaded first so potential questors below can use the definitions
    if (fs.existsSync(paths.quests)) {
      this.loadQuests(area, paths.quests);
    }

    // load items
    if (fs.existsSync(paths.items)) {
      this.loadItems(area, paths.items);
    }

    // load NPCs
    if (fs.existsSync(paths.npcs)) {
      this.loadNpcs(area, paths.npcs);
    }

    // load rooms
    if (fs.existsSync(paths.rooms)) {
      this.loadRooms(area, paths.rooms);
    }

    return area;
  }

  /**
   * Load quest definitions from a specified area of a bundle
   * @param {Area} area Loaded Area
   * @param {string} questsFile Filename for area's quests
   */
  loadQuests(area, questsFile) {
    Logger.verbose(`\t\t${chalk.bold.green('START')}${chalk.bold.white(': QUESTS...')}`);

    // parse the file
    let quests = Data.parseFile(questsFile);

    // set the quest definitions in the factory
    for (const quest of quests) {
      Logger.verbose(`\t\t\t${chalk.bold.cyan(quest.id + ' - ' + quest.title)}`);
      this.state.QuestFactory.add(area.name, quest.id, quest);
      area.loadQuest(this.state.QuestFactory.makeQuestKey(area.name, quest.id));
    }

    Logger.verbose(`\t\t${chalk.bold.blue('DONE')}${chalk.bold.white(': QUESTS')}`);
  }

  /**
   * Load item definitions from a specified area of a bundle
   * @param {Area} area Loaded area
   * @param {string} itemsFile Filename for area's items
   */
  loadItems(area, itemsFile) {
    Logger.verbose(`\t\t${chalk.bold.green('START')}${chalk.bold.white(': ITEMS...')}`);

    // parse the file
    let items = Data.parseFile(itemsFile);

    if (!items || !items.length) {
      return;
    }

    // set the item definitions in the factory
    items.forEach(item => {
      const entityRef = this.state.ItemFactory.createEntityRef(area.name, item.id);
      this.state.ItemFactory.setDefinition(entityRef, item);
      area.loadItem(entityRef);
      Logger.verbose(`\t\t\t${chalk.bold.cyan(item.entityReference + ' - ' + item.name)}`);
    });

    Logger.verbose(`\t\t${chalk.bold.blue('DONE')}${chalk.bold.white(': ITEMS')}`);
  }

  /**
   * Load NPC definitions from a specified area of a bundle
   * @param {Area} area Loaded area
   * @param {string} npcsFile Filename for area's NPCs
   */
  loadNpcs(area, npcsFile) {
    Logger.verbose(`\t\t${chalk.bold.green('START')}${chalk.bold.white(': NPCS...')}`);

    // parse the file
    let npcs = Data.parseFile(npcsFile);

    if (!npcs || !npcs.length) {
      return;
    }

    // set the NPC definitions in the factory
    npcs = npcs.map(npc => {
      const entityRef = this.state.NpcFactory.createEntityRef(area.name, npc.id);
      this.state.NpcFactory.setDefinition(entityRef, npc);
      area.loadNpc(entityRef);
      Logger.verbose(`\t\t\t${chalk.bold.cyan(npc.entityReference + ' - ' + npc.name)}`);

      // move to NPC.hydrate()
      if (npc.quests) {
        // Update quest definitions with their questor
        // TODO: This currently means a given quest can only have a single questor, perhaps not optimal
        for (const qid of npc.quests) {
          const quest = this.state.QuestFactory.get(qid);
          if (!quest) {
            Logger.error(`\t\t\tError: NPC is questor for non-existent quest [${qid}]`);
            continue;
          }
          quest.npc = entityRef;
          this.state.QuestFactory.set(qid, quest);
        }
      }
    });

    Logger.verbose(`\t\t${chalk.bold.blue('DONE')}${chalk.bold.white(': NPCS')}`);
  }

  /**
   * Load room definitions from a specified area of a bundle
   * @param {Area} area Loaded area
   * @param {string} roomsFile Filename for area's rooms
   */
  loadRooms(area, roomsFile) {
    Logger.verbose(`\t\t${chalk.bold.green('START')}${chalk.bold.white(': ROOMS...')}`);

    // parse the file
    let rooms = Data.parseFile(roomsFile);

    if (!rooms || !rooms.length) {
      return;
    }

    // create and load the rooms
    rooms = rooms.map(room => new Room(area, room));
    rooms.forEach(room => {
      Logger.verbose(`\t\t\t${chalk.bold.cyan(room.entityReference + ' - ' + room.title)}`);
      area.addRoom(room);
      this.state.RoomManager.addRoom(room);
    });

    Logger.verbose(`\t\t${chalk.bold.blue('DONE')}${chalk.bold.white(': ROOMS')}`);
  }

  /**
   * Load command definitions from a bundle
   * @param {string} bundle Bundle name
   * @param {string} commandsDir Path to commands directory
   */
  loadCommands(bundle, commandsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': COMMANDS...')}`);
    const files = fs.readdirSync(commandsDir);

    for (const commandFile of files) {
      const commandPath = commandsDir + commandFile;
      if (!Data.isScriptFile(commandPath, commandFile)) {
        continue;
      }

      const commandName = path.basename(commandFile, path.extname(commandFile));
      const command = this.createCommand(commandPath, commandName, bundle);
      this.state.CommandManager.add(command);
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': COMMANDS')}`);
  }

  /**
   * Create a command from a definition
   * @param {string} commandPath Path to command
   * @param {string} commandName Name of command
   * @param {string} bundle Name of bundle from which this command was loaded
   * @return {Command}
   */
  createCommand(commandPath, commandName, bundle) {
    const loader = require(commandPath);
    let cmdImport = loader(srcPath, bundlesPath);
    cmdImport.command = cmdImport.command(this.state);

    Logger.verbose(`\t\t${chalk.bold.cyan(commandName)}`);

    return new Command(
      bundle,
      commandName,
      cmdImport,
      commandPath
    );
  }

  /**
   * Load help definitions from a bundle
   * @param {string} bundle Name of bundle
   * @param {string} helpDir Path to help directory
   */
  loadHelp(bundle, helpDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': HELP...')}`);
    const files = fs.readdirSync(helpDir);

    for (const helpFile of files) {
      const helpPath = helpDir + helpFile;
      if (!fs.statSync(helpPath).isFile()) {
        continue;
      }

      const helpName = path.basename(helpFile, path.extname(helpFile));
      const def = Data.parseFile(helpPath);

      let hfile = null;
      try {
        hfile = new Helpfile(
          bundle,
          helpName,
          def
        );
        Logger.verbose(`\t\t${chalk.cyan.bold(helpName)}`);
      } catch (e) {
        Logger.warn(`\t\t${chalk.bold.yellow(e.message)}`);
        continue;
      }

      this.state.HelpManager.add(hfile);
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': HELP')}`);
  }

  /**
   * Load effect definitions from a bundle
   * @param {string} bundle Name of bundle
   * @param {string} effectsDir Path to effects directory
   */
  loadEffects(bundle, effectsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': EFFECTS...')}`);
    const files = fs.readdirSync(effectsDir);

    for (const effectFile of files) {
      const effectPath = effectsDir + effectFile;
      if (!Data.isScriptFile(effectPath, effectFile)) {
        continue;
      }

      const effectName = path.basename(effectFile, path.extname(effectFile));
      const loader = require(effectPath);

      Logger.verbose(`\t\t${chalk.cyan.bold(effectName)}`);
      this.state.EffectFactory.add(effectName, loader(srcPath));
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': EFFECTS')}`);
  }

  /**
   * Load skill definitions from a bundle
   * @param {string} bundle Name of bundle
   * @param {string} skillsDir Path to skills directory
   */
  loadSkills(bundle, skillsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': SKILLS...')}`);
    const files = fs.readdirSync(skillsDir);

    for (const skillFile of files) {
      const skillPath = skillsDir + skillFile;
      if (!Data.isScriptFile(skillPath, skillFile)) {
        continue;
      }

      const skillName = path.basename(skillFile, path.extname(skillFile));
      const loader = require(skillPath);
      let skillImport = loader(srcPath);
      if (skillImport.run) {
        skillImport.run = skillImport.run(this.state);
      }

      Logger.verbose(`\t\t${chalk.cyan.bold(skillName)}`);
      const skill = new Skill(skillName, skillImport, this.state);

      if (skill.type === SkillType.ABILITY) {
        this.state.AbilityManager.add(skill);
      }
      if (skill.type === SkillType.SPELL) {
        this.state.SpellManager.add(skill);
      }
      if (skill.type === SkillType.DISCIPLINE) {
        this.state.DisciplineManager.add(skill);
      }
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': SKILLS')}`);
  }

  /**
   * Load species definitions from a bundle
   * @param {string} bundle Bundle name
   * @param {string} speciesDir Path to species directory
   */
  loadSpecies(bundle, speciesDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': SPECIES...')}`);
    const files = fs.readdirSync(speciesDir);

    for (const speciesFile of files) {
      const speciesPath = speciesDir + speciesFile;
      if (!Data.isScriptFile(speciesPath, speciesFile)) {
        continue;
      }

      const speciesName = path.basename(speciesFile, path.extname(speciesFile));
      const loader = require(speciesPath);
      let speciesImport = loader(srcPath);

      Logger.verbose(`\t\t${chalk.bold.cyan(speciesName)}`);
      this.state.SpeciesManager.addAspect(speciesName, new Aspect(speciesImport));
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': SPECIES')}`);
  }

  /**
   * Load archetype definitions from a bundle
   * @param {string} bundle Bundle name
   * @param {string} archetypesDir Path to archetypes directory
   */
  loadArchetypes(bundle, archetypesDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': ARCHETYPES...')}`);
    const files = fs.readdirSync(archetypesDir);

    for (const archetypeFile of files) {
      const archetypePath = archetypesDir + archetypeFile;
      if (!Data.isScriptFile(archetypePath, archetypeFile)) {
        continue;
      }

      const archetypeName = path.basename(archetypeFile, path.extname(archetypeFile));
      const loader = require(archetypePath);
      let archetypeImport = loader(srcPath);

      Logger.verbose(`\t\t${chalk.bold.cyan(archetypeName)}`);
      this.state.ArchetypeManager.addAspect(archetypeName, new Aspect(archetypeImport));
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': ARCHETYPES')}`);
  }

  /**
   * Load trait definitions from a bundle
   * @param {string} bundle Bundle name
   * @param {string} traitsDir Path to traits directory
   */
  loadTraits(bundle, traitsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': TRAITS...')}`);
    const files = fs.readdirSync(traitsDir);

    for (const traitFile of files) {
      const traitPath = traitsDir + traitFile;
      if (!Data.isScriptFile(traitPath, traitFile)) {
        continue;
      }

      const traitName = path.basename(traitFile, path.extname(traitFile));
      const loader = require(traitPath);
      let traitImport = loader(srcPath);

      Logger.verbose(`\t\t${chalk.bold.cyan(traitName)}`);
      this.state.TraitManager.addAspect(traitName, new Aspect(traitImport));
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': TRAITS')}`);
  }

  /**
   * Load input events from a bundle
   * @param {string} bundle Bundle name
   * @param {string} inputEventsDir Path to input events directory
   */
  loadInputEvents(bundle, inputEventsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': INPUT EVENTS...')}`);
    const files = fs.readdirSync(inputEventsDir);

    for (const eventFile of files) {
      const eventPath = inputEventsDir + eventFile;
      if (!Data.isScriptFile(eventPath, eventFile)) {
        continue;
      }

      const eventName = path.basename(eventFile, path.extname(eventFile));
      Logger.verbose(`\t\t${chalk.bold.cyan(eventName)}`);
      const eventImport = require(eventPath)(srcPath);

      this.state.InputEventManager.add(eventName, eventImport.event(this.state));
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': INPUT EVENTS')}`);
  }

  /**
   * Load server events from a bundle
   * @param {string} bundle Bundle name
   * @param {string} serverEventsDir Path to server events directory
   */
  loadServerEvents(bundle, serverEventsDir) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': SERVER EVENTS...')}`);
    const files = fs.readdirSync(serverEventsDir);

    for (const eventsFile of files) {
      const eventsPath = serverEventsDir + eventsFile;
      if (!Data.isScriptFile(eventsPath, eventsFile)) {
        continue;
      }

      const eventsName = path.basename(eventsFile, path.extname(eventsFile));
      Logger.verbose(`\t\t${chalk.bold.cyan(eventsName)}`);
      const eventsListeners = require(eventsPath)(srcPath).listeners;

      for (const [eventName, listener] of Object.entries(eventsListeners)) {
        this.state.ServerEventManager.add(eventName, listener(this.state));
      }
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': SERVER EVENTS')}`);
  }

  /**
   * Load channels from a bundle
   * @param {string} bundle Bundle name
   * @param {string} channelsFile Filename for channels
   */
  loadChannels(bundle, channelsFile) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': CHANNELS...')}`);

    const loader = require(channelsFile);
    let channels = loader(srcPath);

    if (!Array.isArray(channels)) {
      channels = [channels];
    }

    channels.forEach(channel => {
      Logger.verbose(`\t\t${chalk.bold.cyan(channel.name)}`);
      channel.bundle = bundle;
      this.state.ChannelManager.add(channel);
    });

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': CHANNELS')}`);
  }

  /**
   * Load player events from a bundle
   * @param {string} bundle Bundle name
   * @param {string} eventsFile Filename for player events
   */
  loadPlayerEvents(bundle, eventsFile) {
    Logger.verbose(`\t${chalk.bold.green('START')}${chalk.bold.white(': PLAYER EVENTS...')}`);

    const playerListeners = require(eventsFile)(srcPath).listeners;

    for (const [eventName, listener] of Object.entries(playerListeners)) {
      Logger.verbose(`\t\t${chalk.bold.cyan(eventName)}`);
      this.state.PlayerManager.addListener(eventName, listener(this.state));
    }

    Logger.verbose(`\t${chalk.bold.blue('DONE')}${chalk.bold.white(': PLAYER EVENTS')}`);
  }
}

module.exports = BundleManager;
