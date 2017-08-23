module.exports = {
    // a function to run the logic for this role
  run: (flag)=> {
    //console.log('flag.run ', flag, flag.color, flag.secondaryColor, flag.room);
    switch (flag.color) {
    case COLOR_GREY:
      switch (flag.secondaryColor) {
      case COLOR_YELLOW: {
        let b = flag.room.createConstructionSite(flag.pos, STRUCTURE_EXTENSION);
        if (b === 0){
          console.log('createConstructionSite STRUCTURE_EXTENSION: ', flag.pos.x, flag.pos.y, flag.room);
          flag.remove(); // remove the flag when the constructionSite is created
        }
        break;
      }
      case COLOR_RED: {
        if (flag.room.controller.level < 3){
            break;
        }
        let b = flag.room.createConstructionSite(flag.pos, STRUCTURE_CONTAINER);
        if (b === 0){
          console.log('createConstructionSite STRUCTURE_CONTAINER: ', flag.pos.x, flag.pos.y, flag.room);
          flag.remove(); // remove the flag when the constructionSite is created
        }
        break;
      }
      case COLOR_PURPLE: {
          if (/^s/.test(flag.name)){
              //console.log(flag, " is a source")
          }
        let b = flag.room.createConstructionSite(flag.pos, STRUCTURE_LINK);
        if (b === 0){
          console.log('createConstructionSite STRUCTURE_LINK: ', flag.pos.x, flag.pos.y, flag.room);
          // TODO: Nastavit jestli je to link na prijimani nebo psilani
          flag.remove(); // remove the flag when the constructionSite is created
        }
        break;
      }
      case COLOR_WHITE: {
        let b = flag.room.createConstructionSite(flag.pos, STRUCTURE_STORAGE);
        if (b === 0){
          console.log('createConstructionSite STRUCTURE_STORAGE: ', flag.pos.x, flag.pos.y, flag.room);
          flag.remove(); // remove the flag when the constructionSite is created
        } else {
          console.log('Flag constructionSite error: ', b, flag.room, JSON.stringify(flag.pos));
        }
        break;
      }
      case COLOR_GREY: {
        let b = flag.room.createConstructionSite(flag.pos, STRUCTURE_ROAD);
        if (b === 0){
          console.log('createConstructionSite STRUCTURE_ROAD: ', flag.pos.x, flag.pos.y, flag.room);
          flag.remove(); // remove the flag when the constructionSite is created
        } else {
          console.log('Flag constructionSite error: ', b, flag.room, JSON.stringify(flag.pos));
        }
        break;
      }
      case COLOR_GREEN: {
        let b = flag.room.createConstructionSite(flag.pos, STRUCTURE_TOWER);
        if (b === 0){
          console.log('createConstructionSite STRUCTURE_TOWER: ', flag.pos.x, flag.pos.y, flag.room);
          flag.remove(); // remove the flag when the constructionSite is created
        }
        break;
      }
      default:

      }
      break;
    default:

    }
  }
};
