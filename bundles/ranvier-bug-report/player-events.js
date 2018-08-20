'use strict';

module.exports = (srcPath) => {
  const Logger = require(srcPath + 'Logger');
  const Config = require(srcPath + 'Config');
  const PlayerRoles = require(srcPath + 'PlayerRoles');
  const Data = require(srcPath + 'Data');

  function getReportMethod(type) {
    switch (type) {
      case 'bug':
        return Logger.error;
      case 'typo':
        return Logger.warn;
      case 'suggestion':
      default:
        return Logger.verbose;
    }
  }

  function getFormattedReport(type, description) {
    const header = getReportHeader.call(this, type, description);
    const specialized = getSpecializedReport.call(this, type, description);
    return `${header}${specialized}`;
  }

  function getReportHeader(type, description) {
    const now = (new Date()).toISOString();
    return `REPORT\nType: ${type}\nReported By: ${this.name}\nRoom: ${this.room.title}\nTime: ${now}\nDescription: ${description}\n`;
  }

  function getSpecializedReport(type, description) {
    const room = this.room;
    const serializeRoom = room => JSON.stringify({
      name: room.name,
      desc: room.description,
      id: (new Date()).toISOString(),
      entities: [...room.items, ...room.players, ...room.npcs].map(ent => ({name: ent.name, id: ent.id, desc: ent.description || '' }))
    });

    switch (type) {
      case 'bug':
        return `PlayerData: ${JSON.stringify(this.serialize())}\nRoomData: ${serializeRoom(room)}`;
      case 'typo':
        return (this.inventory ? `PlayerInv: ${JSON.stringify(this.inventory.serialize())}\nRoomData: ${serializeRoom(room)}` : '');
      case 'suggestion':
      default:
        return '';
    }
  }

  return {
    listeners: {
      bugReport: state => function (report) {
        const { description, type } = report;
        const reportMethod = getReportMethod(type);
        const formattedReport = getFormattedReport.call(this, type, description);

        reportMethod(formattedReport);
        if (Config.get('reportToAdmins')) {
          const message = `New ${type} report from ${this.name}\n=> ${description}`;
          const role = PlayerRoles.ADMIN;
          
          const bugReporter = {
            name: 'ATTN',
            role,
            // implements Broadcastable interface
            getBroadcastTargets() {
              return [];
            }
          }
          state.ChannelManager.get('admin').send(state, bugReporter, message);

          // save report to disk
          Data.saveBug('bug', `${(new Date()).toISOString()} - ${type}}`, formattedReport);
        }
      }
    }
  };
};
