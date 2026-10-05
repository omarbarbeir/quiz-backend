// whoamiServer.js
const whoamiData = require('./data/whoamiData');

function setupWhoamiServer(socket, io, rooms) {

  // ═══════════════════════════════════════════
  //  توزيع الصور — يدويًا لما الأدمن يدوس
  // ═══════════════════════════════════════════
  socket.on('whoami_distribute', ({ roomCode, subcategory }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;   // ✅

    const pool = whoamiData[subcategory];
    if (!pool || pool.length === 0) {
      socket.emit('whoami_error', { message: 'الفئة غير موجودة أو فاضية' });
      return;
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    // حدد كل اللاعبين (الأدمن لاعب دلوقتي)
    const players = room.players;
    if (players.length === 0) return;

    // لو الصور أقل من اللاعبين، هنكرر
    const assignments = {};
    players.forEach((player, i) => {
      const item = shuffled[i % shuffled.length];
      assignments[player.id] = {
        id: item.id,
        image: item.image,
        answer: item.answer,
        category: 'whoami',
        subcategory,
      };
    });

    room.whoamiAssignments = assignments;
    room.whoamiSubcategory = subcategory;

    console.log(`🎭 WHOAMI DISTRIBUTE | room: ${roomCode} | sub: ${subcategory} | ${players.length} players`);

    // ابعت لكل لاعب صورته الخاصة
    players.forEach(player => {
      io.to(player.socketId).emit('whoami_your_image', {
        playerId: player.id,
        question: assignments[player.id],
      });
    });

    // ابعت للأدمن ملخص كامل
    io.to(roomCode).emit('whoami_distributed', {
      subcategory,
      count: players.length,
    });
  });

  // ═══════════════════════════════════════════
  //  إعادة تعيين
  // ═══════════════════════════════════════════
  socket.on('whoami_reset', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (!player?.isAdmin) return;   // ✅
    room.whoamiAssignments = null;
    room.whoamiSubcategory = null;
    io.to(roomCode).emit('whoami_reset_done');
  });

  socket.on('close_game', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    room.whoamiAssignments = null;
    room.whoamiSubcategory = null;
  });
}

module.exports = setupWhoamiServer;