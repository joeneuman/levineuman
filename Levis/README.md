# 2D Dinosaur Platform Game

A simple 2D platformer game built with Phaser 3, featuring an animated dinosaur character, multiple platforms, and physics-based gameplay.

## Features

- **Animated Dinosaur**: Includes idle, walking, and jumping animations with tail sway and leg movement
- **Evil T-Rex Enemies**: Red T-Rex enemies patrol the platforms. Jump on their heads or shoot them to defeat them!
- **Giant Boss T-Rex**: 
  - Appears every 10 levels (levels 10, 20, 30, etc.)
  - Boss levels have NO regular enemies - only the boss
  - 3x larger than normal enemies with glowing red eyes
  - Has 20 health points (takes 20 bullets or 10 jumps to defeat)
  - Health bar displayed at top center of screen
  - Drops 3 ammo boxes when defeated
  - Epic victory fanfare upon defeat
- **Mossy Brick Boxes**: Break boxes by jumping on them from above to get ammo
- **Gun System**: 
  - You always have a gun equipped
  - Start with 10 ammo, maximum capacity of 30
  - Each brick box gives 6 ammo bullets
  - Click anywhere on the screen to shoot bullets at that location
  - Bullets instantly defeat enemies
  - Ammo bar and count displayed in bottom left corner
  - Empty gun makes a "click" sound when out of ammo
- **Infinite Level System**:
  - Walk to the left or right edge of the screen to advance to the next level
  - Each level generates random platform layouts
  - Fewer enemies spawn as you progress (1-3 enemies per level)
  - More platforms appear each level for increased complexity
  - Level counter displayed in top left corner
- **Health System**: 
  - 3 hearts of health displayed in top right corner
  - Color-coded health bar (green = healthy, orange = warning, red = critical)
  - Invincibility frames after taking damage (1 second)
  - Game over when health reaches zero
- **Platform System**: Ground platform and multiple floating platforms to jump between
- **Physics Engine**: Arcade physics with gravity, collision detection, and smooth movement
- **Keyboard Controls**: 
  - Arrow keys (← →) for horizontal movement
  - Up arrow (↑) or Space bar to jump
  - M key to toggle background music on/off
  - Mouse Click to shoot (when you have the gun power-up)
- **Sound Effects**: 
  - Footstep sounds that play automatically as the dinosaur walks
  - Enemy defeat sound when you jump on their heads or shoot them
  - Hurt sound when you collide with enemies
  - Level complete fanfare when advancing to new areas
  - Box break crunch sound when destroying brick boxes
  - Power-up collection sound when picking up items
  - Laser "pew" sound when shooting the gun
  - Empty gun "click" when out of ammo
  - Epic boss defeated fanfare with descending victory notes
  - Cute looping background music with a cheerful melody (toggle with M key)
  - Music status displayed in bottom right corner
  - All audio generated using Web Audio API
- **Visual Polish**: Decorative clouds, textured platforms, and character design

## How to Play

1. Open `index.html` in a web browser
2. Use arrow keys (← →) to move and (↑ or Space) to jump
3. Press **M** to toggle background music on/off
4. **Jump on mossy brick boxes** from above to break them and collect power-ups
5. **Collect the gun** power-up and click anywhere on screen to shoot enemies
6. Jump on evil red T-Rex heads to defeat them - avoid touching their sides!
7. Watch your health bar in the top right - you have 3 hearts
8. **Walk to the left or right edge** of the screen to advance to the next level
9. Survive as long as possible through increasingly difficult levels!

## Technical Details

- **Framework**: Phaser 3 (v3.70.0)
- **Physics**: Arcade Physics with gravity (800 y)
- **Canvas Size**: 800x600 pixels
- **Character Speed**: 200 pixels/second
- **Jump Force**: 550 pixels/second (upward velocity)

## Customization

You can easily customize the game by modifying `game.js`:

- **Gravity**: Change `gravity: { y: 800 }` in the config
- **Movement Speed**: Adjust `moveSpeed` in `handlePlayerMovement()`
- **Jump Height**: Modify `player.setVelocityY(-400)` in the jump handler
- **Colors**: Update the hex color values in the graphics creation functions
- **Add More Platforms**: Add more `platforms.create(x, y, 'platform')` calls in `createPlatforms()`

## Browser Compatibility

Works in all modern browsers that support HTML5 Canvas and ES6 JavaScript.

## Future Enhancements

- Add collectible items (coins, stars)
- Implement score tracking
- Add enemy characters
- Create multiple levels
- Add sound effects and background music
- Replace programmatic graphics with sprite sheets for better visuals
