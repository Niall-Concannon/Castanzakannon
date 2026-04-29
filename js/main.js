// loads all the script files one at a time so the game boots in the right order
(function () {
  // list of every section of the game. the order matters so dont rearrange these
  var sectionScripts = [
    'js/sections/00_cloud_auth.js',
    'js/sections/01_setup_constants_sprites.js',
    'js/sections/02_game_state.js',
    'js/sections/03_input.js',
    'js/sections/04_map.js',
    'js/sections/05_player.js',
    'js/sections/06_dash_trail.js',
    'js/sections/07_muzzle_flash.js',
    'js/sections/08_draw_player.js',
    'js/sections/09_enemies.js',
    'js/sections/10_projectiles.js',
    'js/sections/11_pickups.js',
    'js/sections/12_ui_vials.js',
    'js/sections/13_ui_xp.js',
    'js/sections/14_ui_hud.js',
    'js/sections/15_menu_screens.js',
    'js/sections/16_utilities.js',
    'js/sections/17_game_loop.js'
  ];
  // loads the script at this index then chains into the next one when its done
  function loadAt(index) {
    if (index >= sectionScripts.length) {
      return; // out of files, done loading
    }
    var script = document.createElement("script");
    script.src = sectionScripts[index];
    // once this one is loaded, go get the next
    script.onload = function () {
      loadAt(index + 1);
    };
    document.head.appendChild(script);
  }
  loadAt(0); // start the chain
})();