function love.load()
    RoombaCatI = love.graphics.newImage("RoombaCat.png")
    RoombaCat = {image = RoombaCatI, x = 100, y = 100, r = 0, sx = 0.5, sy = 0.5}
end



function love.update(dt)

end



function love.mousepressed(x, y, button, istouch, presses)
    if button == 1 then
        if RoombaCat.x == 100 then
            RoombaCat.x = 150
        elseif RoombaCat.x == 150 then
            RoombaCat.x = 100
        end
    end
end



function love.draw()
    love.graphics.draw(RoombaCat.image, RoombaCat.x, RoombaCat.y, RoombaCat.r, RoombaCat.sx, RoombaCat.sy)
end