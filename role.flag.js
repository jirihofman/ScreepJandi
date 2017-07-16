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
          console.log('createConstructionSite extension: ', flag.pos.x, flag.pos.y, flag.room);
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
