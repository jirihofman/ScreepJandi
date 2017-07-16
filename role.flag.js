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
      default:

      }
      break;
    default:

    }
  }
};
