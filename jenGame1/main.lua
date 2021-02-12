

function love.load()
    FreeSaladBg = love.graphics.newImage("FreeSaladBg.png")
    FreeSaladCharI1 = love.graphics.newImage("FreeSaladChar1.png")
    FreeSaladCharI2 = love.graphics.newImage("FreeSaladChar2.png")
    FreeSaladFg = love.graphics.newImage("FreeSaladFg.png")
    FreeSaladChar = {image = FreeSaladCharI1, x = 0, y = 0, r = 0, sx = 0.55, sy = 0.55}
end



function love.update(dt)

end



function love.mousepressed(x, y, button, istouch, presses)
    if button == 1 then
        if FreeSaladChar.image == FreeSaladCharI1 then
            FreeSaladChar.image = FreeSaladCharI2
        elseif FreeSaladChar.image == FreeSaladCharI2 then
            FreeSaladChar.image = FreeSaladCharI1
        end
    end
end



function love.draw()
    love.graphics.draw(FreeSaladBg, 0, 0, 0, 0.55, 0.55);
    love.graphics.draw(FreeSaladChar.image, FreeSaladChar.x, FreeSaladChar.y, FreeSaladChar.r, FreeSaladChar.sx, FreeSaladChar.sy)
    love.graphics.draw(FreeSaladFg, 0, 0, 0, 0.55, 0.55);
end