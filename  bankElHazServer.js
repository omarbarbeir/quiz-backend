// ================================================================
// bankElHazServer.js — بعد إصلاح مشكلة تسلسل الدور
// ================================================================

const PLAYER_COLORS = ['#ef4444','#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];

const BOARD_TILES = [
  { id:0,  name:'GO',              type:'start',       price:0,   baseRent:0,  color:null },
  { id:1,  name:'القدس',           type:'land',        price:200, baseRent:10, color:'#1e3a8a' },
  { id:2,  name:'غزة',             type:'land',        price:250, baseRent:10, color:'#1e3a8a' },
  { id:3,  name:'حظك ومحاكمة',     type:'chance_and_community', price:0, baseRent:0, color:null },
  { id:4,  name:'بيروت',           type:'land',        price:200, baseRent:15, color:'#15803d' },
  { id:5,  name:'الرياض',          type:'land',        price:250, baseRent:15, color:'#15803d' },
  { id:6,  name:'بغداد',           type:'land',        price:250, baseRent:20, color:'#15803d' },
  { id:7,  name:'النادي',          type:'club',        price:750, baseRent:0,  color:'#eab308', owners:[] },
  { id:8,  name:'بني غازي',        type:'land',        price:150, baseRent:15, color:'#dc2626' },
  { id:9,  name:'عدن',             type:'land',        price:100, baseRent:10, color:'#dc2626' },
  { id:10, name:'محاكمة',          type:'community',   price:0,   baseRent:0,  color:null },
  { id:11, name:'البحرين',         type:'land',        price:90,  baseRent:10, color:'#dc2626' },
  { id:12, name:'حظك',             type:'chance',      price:0,   baseRent:0,  color:null },
  { id:13, name:'الدار البيضاء',   type:'land',        price:250, baseRent:25, color:'#dc2626' },
  { id:14, name:'محطة بنزين',      type:'station',     price:200, baseRent:50, color:null },
  { id:15, name:'تونس',            type:'land',        price:250, baseRent:25, color:'#c8a96e' },
  { id:16, name:'الجزائر',         type:'land',        price:150, baseRent:15, color:'#c8a96e' },
  { id:17, name:'أتوبيس سريع',     type:'express_bus', price:0,   baseRent:0,  color:null },
  { id:18, name:'الإسكندرية',      type:'land',        price:225, baseRent:22, color:'#c2410c' },
  { id:19, name:'حلب',             type:'land',        price:200, baseRent:20, color:'#c2410c' },
  { id:20, name:'محاكمة',          type:'community',   price:0,   baseRent:0,  color:null },
  { id:21, name:'أسوان',           type:'land',        price:200, baseRent:20, color:'#6d28d9' },
  { id:22, name:'دمشق',            type:'land',        price:250, baseRent:25, color:'#6d28d9' },
  { id:23, name:'القاهرة',         type:'land',        price:450, baseRent:45, color:'#6d28d9' },
  { id:24, name:'السجن',           type:'jail',        price:0,   baseRent:0,  color:null },
  { id:25, name:'الخرطوم',         type:'land',        price:200, baseRent:20, color:'#a16207' },
  { id:26, name:'عمان',            type:'land',        price:250, baseRent:25, color:'#a16207' },
  { id:27, name:'الأقصر',          type:'land',        price:200, baseRent:20, color:'#e2e8f0' },
  { id:28, name:'بور سعيد',        type:'land',        price:250, baseRent:25, color:'#a16207' },
  { id:29, name:'حظك',             type:'chance',      price:0,   baseRent:0,  color:null },
  { id:30, name:'صنعاء',           type:'land',        price:250, baseRent:25, color:'#78350f' },
  { id:31, name:'محاكمة',          type:'community',   price:0,   baseRent:0,  color:null },
  { id:32, name:'الكويت',          type:'land',        price:250, baseRent:25, color:'#78350f' },
  { id:33, name:'قطر',             type:'land',        price:150, baseRent:15, color:'#78350f' },
].map(t => ({ ...t, owner:null, buildingLevel:0, isMortgaged:false }));

const CHANCE_CARDS = [
  { id:'ch1',  text:'أنت محب للأشياء الجميلة — ادفع ٥٠ جنيه ثمن ملابس لك و٥٠ أخرى لأسرتك', type:'money', amount:-100 },
  { id:'ch2',  text:'عندك ٤ أطفال — ادفع ٢٥ جنيه مصاريف مدرسة عن كل طفل', type:'money', amount:-100 },
  { id:'ch3',  text:'حصل اصتدام بسيارتك وتدفع لك شركة التأمين ٢٠٠ جنيه — ارجع ٥ خطوات للخلف', type:'money_and_move', amount:200, steps:-5 },
  { id:'ch4',  text:'كرت يدفع عنك البنك اللعبة القادمة — احتفظ به', type:'bank_pays_next', amount:0 },
  { id:'ch5',  text:'تقدم ٤ خانات ولا تدفع غير نصف الإيجار لصاحب البلد في هذه الخطوة', type:'move_half_rent', steps:4 },
  { id:'ch6',  text:'حظك من السماء رزقت بطفل جميل — خذ ٥٠ جنيه من كل لاعب', type:'collect_from_players', amount:50 },
  { id:'ch7',  text:'أنت كثير الهزار — ادفع ١٠٠ جنيه غرامة', type:'money', amount:-100 },
  { id:'ch8',  text:'أنت هادي ومحب لأسرتك — ادفع ١٥٠ جنيه ثمن فواتير خياطة عن زوجتك', type:'money', amount:-150 },
  { id:'ch9',  text:'أنت داهية استطعت أن تقنع حماتك على تركك والسفر — خذ ١٠٠ جنيه مصاريف السفر', type:'money', amount:100 },
  { id:'ch10', text:'حماتك تحبك أرسلت لك ١٠٠ جنيه حوالة — اذهب للبحرين وخذها', type:'move_to_city_and_collect', city:'البحرين', amount:100 },
  { id:'ch11', text:'أنت طيب القلب تبرعت بـ١٠٠ جنيه للإسعاف — ادفعها وانتقل لنقطة البداية وخذ ٢٥٠ جنيه معاشك', type:'pay_and_goto_start', payAmount:100, collectAmount:250 },
  { id:'ch12', text:'ربحت جائزة الإذاعة — اختر: اذهب لغزة أو عمان أو دمشق وخذ ١٠٠ جنيه من البنك', type:'choose_city_and_collect', cities:['غزة','عمان','دمشق'], amount:100 },
  { id:'ch13', text:'ربحت سحب الادخار — خذ ١٥٠ جنيه أو مدينة لا يزيد ثمنها عن ١٥٠ جنيه', type:'choose_city_or_money', cityMaxPrice:150, amount:150 },
  { id:'ch14', text:'أنت وطني مخلص ربحت جائزة كيف تخدم بلدك — خذ ٥٠ جنيه', type:'money', amount:50 },
  { id:'ch15', text:'عيد ميلادك — خذ من كل لاعب ٢٠ جنيه', type:'collect_from_players', amount:20 },
];

const COMMUNITY_CARDS = [
  { id:'com1',  text:'ربحت قضيتك ضد زملائك خذ ٢٥ جنيه من كل لاعب', type:'collect_from_players', amount:25 },
  { id:'com2',  text:'هارب من العسكرية اذهب للسجن حالاً', type:'go_to_jail', amount:0 },
  { id:'com3',  text:'خسرت قضيتك ادفع ١٥ جنيه أتعاب محاماة', type:'money', amount:-15 },
  { id:'com4',  text:'ربحت قضيتك ضد البنك — خذ أي مدينة لا يزيد ثمنها عن ١٥٠ جنيه أو خذ ١٠٠ جنيه من البنك', type:'choose_city_or_money', cityMaxPrice:150, amount:100 },
  { id:'com5',  text:'اتُهمت غدر وظهرت براءتك خذ ٢٠٠ جنيه تعويض من البنك', type:'money', amount:200 },
  { id:'com6',  text:'تذكرة أمان للخروج من السجن — اذهب للسجن حالاً وستخرج في دورك القادم', type:'jail_with_card', amount:0 },
  { id:'com7',  text:'ادفع تصليحات: ١٠٠ جنيه عن كل سوق، ٥٠ جنيه عن كل جراج، ٢٥ جنيه عن كل استراحة', type:'repairs', rates:{ 3:100, 2:50, 1:25 } },
  { id:'com8',  text:'خذ من أصحاب بيروت والكويت وصنعاء ٥٠ جنيه من كل لاعب', type:'collect_from_city_owners', cities:['بيروت','الكويت','صنعاء'], amount:50 },
  { id:'com9',  text:'كسرت عمود نور بسيارتك ادفع ٤٠ جنيه مخالفة', type:'money', amount:-40 },
  { id:'com10', text:'ربحت سحب الادخار خذ ١٠٠ جنيه من البنك', type:'money', amount:100 },
  { id:'com11', text:'شاهد زور — اذهب للسجن حالاً! (محتاج تجيب نفس الرقم عشان تخرج)', type:'pay_or_jail', amount:0 },
  { id:'com12', text:'القيت زبالة في الشارع ادفع ٥٩ جنيه غرامة', type:'money', amount:-59 },
  { id:'com13', text:'أنت موقوف بتهمة إقلاق الراحة — اخسر دورك القادم وادفع ٥٠ جنيه', type:'skip_turn_and_pay', amount:50 },
  { id:'com14', text:'بطاقة أمان للخروج من السجن — احتفظ بيها أو بيعها', type:'get_out_of_jail', amount:0 },
  { id:'com15', text:'يدفع لك البنك ٢٥ جنيه عن كل سوق أو استراحة أو جراج', type:'collect_per_building', rate:25 },
];

const INTERACTIVE_CARD_TYPES = ['choose_city_or_money', 'choose_city_and_collect'];

function shuffleDeck(deck) {
  const d = [...deck];
  for (let i = d.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function rollDice() { return Math.floor(Math.random()*6)+1; }

const bankGames = {};

function initGame(roomId, playersList) {
  const sorted = [...playersList].sort(()=>Math.random()-0.5);
  return {
    roomId,
    players: sorted.map((p,i) => ({
      ...p,
      position: 0, money: 1500, properties: [],
      inJail: false, jailTurns: 0, isBanker: i===0,
      isOnExpressBus: false, eliminated: false, getOutOfJailCards: 0,
    })),
    board: BOARD_TILES.map(t=>({ ...t, _originalBaseRent: t.baseRent })),
    currentTurnIndex: 0,
    phase: 'initial_roll',
    diceValue: 1,
    chanceDeck:    shuffleDeck(CHANCE_CARDS),
    communityDeck: shuffleDeck(COMMUNITY_CARDS),
    initialRolls: {},
    turnOrder: [],
    gameOver: false,
    winner: null,
    pendingPayments: [],
    awaitingResponseFrom: null,
    awaitingResponseKind: null,
  };
}

function broadcastGameState(io, roomId) {
  const room = bankGames[roomId];
  if (!room || !room.game) return;
  const game = room.game;
  io.to(`bank_${roomId}`).emit('bank_state_update', {
    players: game.players.map(p => ({
      id:p.id, name:p.name, color:p.color,
      money:p.money, position:p.position,
      inJail:p.inJail, isBanker:p.isBanker,
      eliminated:p.eliminated, properties:p.properties,
      getOutOfJailCards:p.getOutOfJailCards,
      jailRollNeeded:p.jailRollNeeded || null,
      jailTurns:p.jailTurns || 0,
      jailFromCard:p.jailFromCard || false,
      skipNextTurn:p.skipNextTurn || false,
    })),
    board: game.board.map(t => ({
      id:t.id, name:t.name, type:t.type,
      owner:t.owner, buildingLevel:t.buildingLevel,
      isMortgaged:t.isMortgaged, price:t.price,
      baseRent: t._originalBaseRent ?? t.baseRent,
      currentRent: t.baseRent,
    })),
    currentTurnIndex: game.currentTurnIndex,
    phase:            game.phase,
    diceValue:        game.diceValue,
    gameOver:         game.gameOver,
    winner:           game.winner,
    turnOrder:        game.turnOrder,
    chanceDeckCount:    game.chanceDeck.length,
    communityDeckCount: game.communityDeck.length,
    awaitingResponseFrom: game.awaitingResponseFrom || null,
    awaitingResponseKind: game.awaitingResponseKind || null,
  });
}

function getNextPlayerIndex(game, currentIndex) {
  const active = game.players.filter(p=>!p.eliminated);
  if (active.length <= 1) return -1;
  let next = (currentIndex+1) % game.players.length;
  let attempts = 0;
  while (game.players[next].eliminated && attempts < game.players.length) {
    next = (next+1) % game.players.length;
    attempts++;
  }
  return game.players[next].eliminated ? -1 : next;
}

function advanceTurnAndBroadcast(game, io, roomId) {
  let nextIdx = getNextPlayerIndex(game, game.currentTurnIndex);
  if (nextIdx === -1 || game.players.filter(p=>!p.eliminated).length <= 1) {
    game.gameOver = true;
    const lastActive = game.players.find(p=>!p.eliminated);
    game.winner = lastActive?.id || null;
    io.to(`bank_${roomId}`).emit('bank_game_over', { winnerId: game.winner });
    broadcastGameState(io, roomId);
    return;
  }
  game.currentTurnIndex = nextIdx;
  const nextPlayerId = game.turnOrder[nextIdx];
  const nextPlayer = game.players.find(p => p.id === nextPlayerId);

  if (nextPlayer && nextPlayer.skipNextTurn) {
    delete nextPlayer.skipNextTurn;
    io.to(`bank_${roomId}`).emit('bank_notification', {
      text: `⏭️ ${nextPlayer.name} خسر دوره بسبب الكارت`,
      type: 'warning',
    });
    broadcastGameState(io, roomId);
    setTimeout(() => advanceTurnAndBroadcast(game, io, roomId), 1500);
    return;
  }

  broadcastGameState(io, roomId);
}

// ✅ دالة موحدة: إذا كان اللاعب مسؤول عن العرض المعلق، أنجز الدور
function completeResponseAndAdvance(game, io, roomId, playerId) {
  if (game.awaitingResponseFrom === playerId) {
    game.awaitingResponseFrom = null;
    game.awaitingResponseKind = null;
    advanceTurnAndBroadcast(game, io, roomId);
    return true;
  }
  broadcastGameState(io, roomId);
  return false;
}

function applyCardEffect(player, card, game, io, roomId) {
  const TOTAL_TILES = 34;
  switch (card.type) {
    case 'money':
      player.money += card.amount;
      break;
    case 'go_to_jail':
      player.inJail = true;
      player.position = 24;
      player.jailRollNeeded = null;
      player.jailFromCard = true;
      player.jailTurns = 0;
      break;
    case 'jail_with_card':
      player.inJail = true;
      player.position = 24;
      player.jailFromCard = true;
      player.jailRollNeeded = null;
      player.jailTurns = 0;
      player.getOutOfJailCards += 1;
      break;
    case 'get_out_of_jail':
      player.getOutOfJailCards += 1;
      break;
    case 'collect_from_players': {
      if (!game.pendingPayments) game.pendingPayments = [];
      game.players.forEach(p => {
        if (p.id !== player.id && !p.eliminated) {
          const pay = Math.min(card.amount, p.money);
          const reqId = `${card.id}_${p.id}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
          game.pendingPayments.push({
            reqId, fromId: p.id, toId: player.id, amount: pay, status: 'pending',
          });
          io.to(`bank_${roomId}`).emit('bank_payment_request', {
            reqId, fromId: p.id, toId: player.id, toName: player.name,
            amount: pay, reason: card.text,
          });
        }
      });
      break;
    }
    case 'money_and_move': {
      player.money += card.amount;
      let np = player.position + card.steps;
      if (np < 0) np += TOTAL_TILES;
      player.position = np % TOTAL_TILES;
      break;
    }
    case 'bank_pays_next':
      player.bankPaysNext = true;
      break;
    case 'move_half_rent': {
      const oldPos = player.position;
      let np2 = (player.position + card.steps) % TOTAL_TILES;
      if (np2 < oldPos) player.money += 200;
      player.position = np2;
      player.halfRentNextLand = true;
      break;
    }
    case 'move_to_city_and_collect': {
      const t = game.board.find(t => t.name === card.city);
      if (t) {
        if (t.id < player.position) player.money += 200;
        player.position = t.id;
      }
      player.money += card.amount;
      break;
    }
    case 'pay_and_goto_start':
      player.money -= card.payAmount;
      player.position = 0;
      player.money += card.collectAmount;
      break;
    case 'repairs': {
      let total = 0;
      game.board.forEach(tile => {
        if (tile.owner === player.id && tile.buildingLevel > 0) {
          total += (card.rates[tile.buildingLevel] || 0);
        }
      });
      player.money -= total;
      io.to(`bank_${roomId}`).emit('bank_notification', {
        text:`🔧 ${player.name} دفع ${total} جنيه تصليحات`, type:'warning',
      });
      break;
    }
    case 'collect_from_city_owners': {
      if (!game.pendingPayments) game.pendingPayments = [];
      (card.cities||[]).forEach(cityName => {
        const tile = game.board.find(t => t.name === cityName);
        if (tile && tile.owner && tile.owner !== player.id) {
          const owner = game.players.find(p => p.id === tile.owner);
          if (owner && !owner.eliminated) {
            const pay = Math.min(card.amount, owner.money);
            const reqId = `${card.id}_${owner.id}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
            game.pendingPayments.push({
              reqId, fromId: owner.id, toId: player.id, amount: pay, status: 'pending',
            });
            io.to(`bank_${roomId}`).emit('bank_payment_request', {
              reqId, fromId: owner.id, toId: player.id, toName: player.name,
              amount: pay, reason: card.text,
            });
          }
        }
      });
      break;
    }
    case 'collect_per_building': {
      let total = 0;
      game.board.forEach(tile => {
        if (tile.owner === player.id && tile.buildingLevel > 0) total += card.rate;
      });
      player.money += total;
      io.to(`bank_${roomId}`).emit('bank_notification', {
        text:`🏗️ ${player.name} استلم ${total} جنيه من البنك عن مبانيه`, type:'success',
      });
      break;
    }
    case 'skip_turn_and_pay':
      player.money -= card.amount;
      player.skipNextTurn = true;
      break;
    case 'choose_city_or_money':
    case 'choose_city_and_collect':
      break;
    case 'pay_or_jail':
      player.inJail = true;
      player.position = 24;
      player.jailFromCard = false;
      player.jailRollNeeded = game.diceValue || 6;
      player.jailTurns = 0;
      break;
    default:
      if (card.amount) player.money += card.amount;
      break;
  }
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🏦 BankElHaz: Client ${socket.id} connected`);

    socket.on('bank_join', ({ roomId, playerId, playerName, isAdmin }) => {
      try {
        if (!bankGames[roomId]) {
          bankGames[roomId] = {
            players: [],
            game: null,
            adminSocketId: null,
            adminPlayerId: null,
          };
        }
        const room = bankGames[roomId];

        if (isAdmin) {
          room.adminSocketId = socket.id;
          room.adminPlayerId = playerId;
        }

        let player = room.players.find(p=>p.id===playerId);
        if (!player) {
          if (room.players.length >= 12) {
            socket.emit('bank_error', { message: 'الغرفة ممتلئة — الحد الأقصى ١٢ لاعب' });
            return;
          }
          const colorIdx = room.players.length % PLAYER_COLORS.length;
          player = {
            id:playerId, name:playerName||'لاعب',
            socketId:socket.id, color:PLAYER_COLORS[colorIdx],
            isAdmin: !!isAdmin,
          };
          room.players.push(player);
        } else {
          player.socketId = socket.id;
          player.isAdmin = !!isAdmin;
        }

        socket.join(`bank_${roomId}`);
        socket.emit('bank_joined', { roomId, playerId, color:player.color });

        const active = room.players.filter(p=>!p.eliminated);

        if (active.length >= 2 && !room.game) {
          room.game = initGame(roomId, room.players);
          io.to(`bank_${roomId}`).emit('bank_initial_roll_phase', {
            message: '🎲 قوموا برمي النرد لتحديد ترتيب اللعب! الأعلى رقم يبدأ أول.',
          });
          broadcastGameState(io, roomId);
          return;
        }

        if (room.game) {
          const alreadyInGame = room.game.players.find(p => p.id === playerId);

          if (room.game.phase === 'initial_roll' && !alreadyInGame) {
            room.game.players.push({
              ...player,
              position: 0, money: 1500, properties: [],
              inJail: false, jailTurns: 0, isBanker: false,
              isOnExpressBus: false, eliminated: false, getOutOfJailCards: 0,
            });

            io.to(`bank_${roomId}`).emit('bank_notification', {
              text: `👋 ${player.name} انضم للعبة — ${room.game.players.length} لاعبين`,
              type: 'info',
            });

            if (!room.game.initialRolls[playerId]) {
              socket.emit('bank_initial_roll_phase', {
                message: '🎲 ارمِ النرد لتحديد ترتيب اللعب!',
              });
            }
          }

          broadcastGameState(io, roomId);

          if (room.game.phase === 'initial_roll') {
            socket.emit('bank_initial_roll_phase', {
              message: '🎲 قوموا برمي النرد لتحديد ترتيب اللعب!',
            });
          }
        }
      } catch (err) {
        console.error('❌ bank_join error:', err);
        socket.emit('bank_error', { message:'حدث خطأ أثناء الانضمام' });
      }
    });

    socket.on('bank_roll_initial', ({ roomId, playerId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game || room.game.phase !== 'initial_roll') {
          socket.emit('bank_error', { message:'ليس وقت الرمية الأولية' });
          return;
        }
        const game = room.game;
        if (game.initialRolls[playerId]) {
          socket.emit('bank_error', { message:'لقد رميت بالفعل' });
          return;
        }

        const value = rollDice();
        game.initialRolls[playerId] = { value, timestamp: Date.now() };

        io.to(`bank_${roomId}`).emit('bank_initial_roll_result', { playerId, value });

        const allRolled = game.players
          .filter(p=>!p.eliminated)
          .every(p => game.initialRolls[p.id]);

        if (allRolled) {
          const sorted = game.players
            .filter(p=>!p.eliminated)
            .sort((a,b) => {
              const va = game.initialRolls[a.id]?.value || 0;
              const vb = game.initialRolls[b.id]?.value || 0;
              if (vb !== va) return vb - va;
              return (game.initialRolls[a.id]?.timestamp||0) - (game.initialRolls[b.id]?.timestamp||0);
            });

          if (sorted.length >= 2 &&
              game.initialRolls[sorted[0].id].value === game.initialRolls[sorted[1].id].value) {
            const tied = sorted.filter(p =>
              game.initialRolls[p.id].value === game.initialRolls[sorted[0].id].value
            );
            tied.forEach(p => delete game.initialRolls[p.id]);
            io.to(`bank_${roomId}`).emit('bank_initial_roll_tie', {
              players: tied.map(p=>({ id:p.id, name:p.name })),
              message: `⚖️ تعادل بين ${tied.map(p=>p.name).join(' و')}! قوموا بإعادة الرمي`,
            });
            return;
          }

          game.turnOrder = sorted.map(p=>p.id);
          game.currentTurnIndex = 0;
          game.phase = 'playing';

          io.to(`bank_${roomId}`).emit('bank_game_started', {
            turnOrder: game.turnOrder.map(id => {
              const p = game.players.find(pl=>pl.id===id);
              return { id, name:p?.name };
            }),
            currentPlayerId: game.turnOrder[0],
          });

          io.to(`bank_${roomId}`).emit('bank_notification', {
            text: `🎮 ترتيب اللعب: ${sorted.map(p=>p.name).join(' ← ')}`,
            type: 'success',
          });

          broadcastGameState(io, roomId);
        }
      } catch (err) {
        console.error('❌ bank_roll_initial error:', err);
        socket.emit('bank_error', { message:'حدث خطأ في الرمية الأولية' });
      }
    });

    socket.on('bank_roll', ({ roomId, playerId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game || room.game.phase !== 'playing' || room.game.gameOver) {
          socket.emit('bank_error', { message:'اللعبة لم تبدأ أو انتهت' });
          return;
        }
        const game = room.game;

        // ✅ لو في عرض معلق من نفس اللاعب، امنعه من الرمي مرة أخرى
        if (game.awaitingResponseFrom === playerId) {
          socket.emit('bank_error', { message: 'لازم تخلص العرض الحالي أولاً' });
          return;
        }

        const currentPlayerId = game.turnOrder[game.currentTurnIndex];
        if (currentPlayerId !== playerId) {
          socket.emit('bank_error', { message:'ليس دورك الآن' });
          return;
        }
        const player = game.players.find(p=>p.id===playerId);
        if (!player || player.eliminated) return;

        const dice1 = rollDice();
        game.diceValue = dice1;

        io.to(`bank_${roomId}`).emit('bank_dice_rolled', { playerId, dice1 });

        setTimeout(() => {
          try {
            const room2 = bankGames[roomId];
            if (!room2?.game) return;
            const g = room2.game;
            const p = g.players.find(pl=>pl.id===playerId);
            if (!p) return;

            if (p.inJail) {
              p.jailTurns = (p.jailTurns || 0) + 1;
              if (!p.jailFromCard && p.jailRollNeeded !== null && dice1 === p.jailRollNeeded) {
                p.inJail = false;
                p.jailRollNeeded = null;
                p.jailTurns = 0;
                io.to(`bank_${roomId}`).emit('bank_notification', {
                  text: `🔓 ${p.name} جاب ${dice1} وخرج من السجن!`, type:'success',
                });
              } else {
                const needed = p.jailFromCard
                  ? 'استخدم بطاقة الخروج أو ادفع ٥٠ جنيه'
                  : `محتاج تجيب ${p.jailRollNeeded} عشان تخرج`;
                io.to(`bank_${roomId}`).emit('bank_notification', {
                  text: `⛓️ ${p.name} جاب ${dice1} — ${needed}`, type:'warning',
                });
                io.to(`bank_${roomId}`).emit('bank_player_moved', {
                  playerId, newPosition: p.position, totalSteps: 0, passedStart: false,
                });
                advanceTurnAndBroadcast(g, io, roomId);
                return;
              }
            }

            let totalSteps = dice1;
            if (p.isOnExpressBus) {
              totalSteps = dice1 * 2;
              p.isOnExpressBus = false;
              io.to(`bank_${roomId}`).emit('bank_notification', {
                text: `🚌 ${p.name} على الأتوبيس السريع! تحرك ${totalSteps} خطوات`, type:'info',
              });
            }

            const TOTAL_TILES = 34;
            const oldPos = p.position;
            let newPosition = (p.position + totalSteps) % TOTAL_TILES;
            let passedStart = newPosition < oldPos && totalSteps > 0;
            if (passedStart) {
              p.money += 200;
              io.to(`bank_${roomId}`).emit('bank_notification', {
                text: `💰 ${p.name} مر بـ GO واستلم ٢٠٠ جنيه`, type:'success',
              });
            }
            p.position = newPosition;

            io.to(`bank_${roomId}`).emit('bank_player_moved', {
              playerId, newPosition, totalSteps, passedStart,
            });

            setTimeout(() => {
              try {
                const room3 = bankGames[roomId];
                if (!room3?.game) return;
                const g3 = room3.game;
                const p3 = g3.players.find(pl=>pl.id===playerId);
                if (!p3) return;

                const tile = g3.board.find(t => t.id === newPosition);
                if (!tile) {
                  advanceTurnAndBroadcast(g3, io, roomId);
                  return;
                }

                // ✅ متغيرات تتبع هل نحتاج ننتظر رد اللاعب أم لا
                let awaiting = false;
                let awaitingKind = null;

                switch (tile.type) {
                  case 'go_to_jail':
                    p3.inJail = true;
                    p3.position = 24;
                    p3.jailRollNeeded = dice1;
                    p3.jailFromCard = false;
                    p3.jailTurns = 0;
                    io.to(`bank_${roomId}`).emit('bank_notification', {
                      text: `⛓️ ${p3.name} دخل السجن! محتاج يجيب ${dice1} عشان يخرج`, type:'error',
                    });
                    break;

                  case 'jail':
                    p3.inJail = true;
                    p3.jailRollNeeded = dice1;
                    p3.jailFromCard = false;
                    p3.jailTurns = 0;
                    io.to(`bank_${roomId}`).emit('bank_notification', {
                      text: `⛓️ ${p3.name} وقع على السجن! محتاج يجيب ${dice1} عشان يخرج`, type:'error',
                    });
                    break;

                  case 'chance': {
                    if (!g3.chanceDeck.length) g3.chanceDeck = shuffleDeck(CHANCE_CARDS);
                    const card = g3.chanceDeck.pop();
                    applyCardEffect(p3, card, g3, io, roomId);
                    io.to(`bank_${roomId}`).emit('bank_card_drawn', { playerId, card, type:'chance' });
                    // ✅ ننتظر رد اللاعب قبل ما ننقل الدور
                    awaiting = true;
                    awaitingKind = INTERACTIVE_CARD_TYPES.includes(card.type) ? 'card_interactive' : 'card';
                    break;
                  }

                  case 'chance_and_community': {
                    if (!g3.chanceDeck.length) g3.chanceDeck = shuffleDeck(CHANCE_CARDS);
                    const chanceCard = g3.chanceDeck.pop();
                    applyCardEffect(p3, chanceCard, g3, io, roomId);

                    if (!g3.communityDeck.length) g3.communityDeck = shuffleDeck(COMMUNITY_CARDS);
                    const communityCard = g3.communityDeck.pop();
                    applyCardEffect(p3, communityCard, g3, io, roomId);

                    io.to(`bank_${roomId}`).emit('bank_cards_drawn', {
                      playerId,
                      cards: [
                        { card: chanceCard,    pileType: 'chance' },
                        { card: communityCard, pileType: 'community' },
                      ],
                    });
                    awaiting = true;
                    const anyInteractive =
                      INTERACTIVE_CARD_TYPES.includes(chanceCard.type) ||
                      INTERACTIVE_CARD_TYPES.includes(communityCard.type);
                    awaitingKind = anyInteractive ? 'card_interactive' : 'card';
                    break;
                  }

                  case 'community': {
                    if (!g3.communityDeck.length) g3.communityDeck = shuffleDeck(COMMUNITY_CARDS);
                    const card = g3.communityDeck.pop();
                    applyCardEffect(p3, card, g3, io, roomId);
                    io.to(`bank_${roomId}`).emit('bank_card_drawn', { playerId, card, type:'community' });
                    awaiting = true;
                    awaitingKind = INTERACTIVE_CARD_TYPES.includes(card.type) ? 'card_interactive' : 'card';
                    break;
                  }

                  case 'express_bus':
                    p3.isOnExpressBus = true;
                    io.to(`bank_${roomId}`).emit('bank_notification', {
                      text: `🚌 ${p3.name} وقف على الأتوبيس السريع! الرمية القادمة تتضاعف`, type:'info',
                    });
                    break;

                  case 'station':
                    if (tile.owner === null) {
                      socket.emit('bank_offer_buy', {
                        tileId: tile.id, price: tile.price,
                        canAfford: p3.money >= tile.price,
                      });
                      awaiting = true;
                      awaitingKind = 'buy';
                    } else if (tile.owner !== playerId) {
                      const owner = g3.players.find(pl=>pl.id===tile.owner);
                      if (owner && !owner.eliminated) {
                        let rent = tile.baseRent;
                        let finalRent = rent;
                        let isHalf = false;
                        if (p3.halfRentNextLand) {
                          finalRent = Math.floor(rent / 2);
                          isHalf = true;
                        }
                        socket.emit('bank_offer_rent', {
                          tileId: tile.id, tileName: tile.name,
                          ownerName: owner.name, ownerId: owner.id,
                          rent: finalRent, canAfford: p3.money >= finalRent,
                          isHalf, bankPays: p3.bankPaysNext || false,
                        });
                        awaiting = true;
                        awaitingKind = 'rent';
                      }
                    }
                    break;

                  case 'club': {
                    const clubOwners = (tile.owners || []).filter(id => {
                      const o = g3.players.find(pl=>pl.id===id);
                      return o && !o.eliminated;
                    });
                    if (clubOwners.includes(playerId)) {
                      io.to(`bank_${roomId}`).emit('bank_notification', {
                        text:`🎰 ${p3.name} وقف على النادي — أنت شريك هنا!`, type:'info',
                      });
                    } else if (clubOwners.length === 0) {
                      socket.emit('bank_offer_club', {
                        tileId: tile.id,
                        fullPrice: tile.price,
                        halfPrice: Math.floor(tile.price / 2),
                        canAffordFull: p3.money >= tile.price,
                        canAffordHalf: p3.money >= Math.floor(tile.price / 2),
                        currentOwners: [],
                        rent: Math.floor(tile.price * 0.1),
                      });
                      awaiting = true;
                      awaitingKind = 'club';
                    } else if (clubOwners.length === 1) {
                      const halfPrice = Math.floor(tile.price / 2);
                      const rent = Math.floor(tile.price * 0.1);
                      const ownerName = g3.players.find(pl=>pl.id===clubOwners[0])?.name || 'المالك';
                      socket.emit('bank_offer_club', {
                        tileId: tile.id, fullPrice: null, halfPrice,
                        canAffordFull: false,
                        canAffordHalf: p3.money >= halfPrice,
                        currentOwners: clubOwners, ownerName, rent,
                        canAffordRent: p3.money >= rent,
                      });
                      awaiting = true;
                      awaitingKind = 'club';
                    } else {
                      const rent = Math.floor(tile.price * 0.1);
                      const ownerNames = clubOwners.map(id => g3.players.find(pl=>pl.id===id)?.name).filter(Boolean).join(' و ');
                      let finalRent = rent;
                      let isHalf = false;
                      if (p3.halfRentNextLand) {
                        finalRent = Math.floor(rent / 2);
                        isHalf = true;
                      }
                      socket.emit('bank_offer_rent', {
                        tileId: tile.id, tileName: tile.name,
                        ownerName: ownerNames, ownerId: null,
                        rent: finalRent, canAfford: p3.money >= finalRent,
                        isHalf, bankPays: p3.bankPaysNext || false, isClub: true,
                      });
                      awaiting = true;
                      awaitingKind = 'rent';
                    }
                    break;
                  }

                  case 'land':
                    if (tile.owner === null) {
                      socket.emit('bank_offer_buy', {
                        tileId: tile.id, price: tile.price,
                        canAfford: p3.money >= tile.price,
                      });
                      awaiting = true;
                      awaitingKind = 'buy';
                    } else if (tile.owner !== playerId) {
                      const owner = g3.players.find(pl=>pl.id===tile.owner);
                      if (owner && !owner.eliminated && !tile.isMortgaged) {
                        let rent = tile.baseRent;
                        let finalRent = rent;
                        let isHalf = false;
                        if (p3.halfRentNextLand) {
                          finalRent = Math.floor(rent / 2);
                          isHalf = true;
                        }
                        socket.emit('bank_offer_rent', {
                          tileId: tile.id, tileName: tile.name,
                          ownerName: owner.name, ownerId: owner.id,
                          rent: finalRent, canAfford: p3.money >= finalRent,
                          isHalf, bankPays: p3.bankPaysNext || false,
                        });
                        awaiting = true;
                        awaitingKind = 'rent';
                      }
                    }
                    break;

                  case 'tax':
                    p3.money -= (tile.price || 200);
                    io.to(`bank_${roomId}`).emit('bank_notification', {
                      text: `💰 ${p3.name} دفع ضريبة ${tile.price||200} جنيه`, type:'warning',
                    });
                    break;

                  default: break;
                }

                if (awaiting) {
                  g3.awaitingResponseFrom = playerId;
                  g3.awaitingResponseKind = awaitingKind;
                  broadcastGameState(io, roomId);
                } else {
                  advanceTurnAndBroadcast(g3, io, roomId);
                }
              } catch (err) {
                console.error('❌ bank_roll phase 3 error:', err);
              }
            }, 2500);

          } catch (err) {
            console.error('❌ bank_roll phase 2 error:', err);
          }
        }, 1600);

      } catch (err) {
        console.error('❌ bank_roll error:', err);
        socket.emit('bank_error', { message:'حدث خطأ أثناء الرمية' });
      }
    });

    socket.on('bank_buy', ({ roomId, playerId, tileId, buyFull }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game   = room.game;
        const player = game.players.find(p=>p.id===playerId);
        const tile   = game.board.find(t=>t.id===tileId);
        if (!player || !tile) { socket.emit('bank_error', { message:'خطأ في البيانات' }); return; }

        if (tile.type === 'club') {
          if (!tile.owners) tile.owners = [];
          if (tile.owners.includes(playerId)) {
            socket.emit('bank_error', { message:'أنت بالفعل شريك في النادي' }); return;
          }
          if (tile.owners.length >= 2) {
            socket.emit('bank_error', { message:'النادي ممتلئ' }); return;
          }
          const isBuyFull = buyFull !== false;
          const price   = (tile.owners.length === 0 && isBuyFull) ? tile.price : Math.floor(tile.price / 2);
          if (player.money < price) { socket.emit('bank_error', { message:'معكش فلوس كافية' }); return; }
          player.money -= price;
          tile.owners.push(playerId);
          if (!player.properties.includes(tileId)) player.properties.push(tileId);
          const partnerNames = tile.owners.map(id=>game.players.find(p=>p.id===id)?.name).filter(Boolean).join(' و ');
          io.to(`bank_${roomId}`).emit('bank_notification', {
            text:`🎰 ${player.name} ${isBuyFull && tile.owners.length===1 ? 'اشترى النادي بالكامل' : 'انضم شريكاً في النادي'}! الشركاء: ${partnerNames}`,
            type:'success',
          });
          completeResponseAndAdvance(game, io, roomId, playerId);
          return;
        }

        if (tile.owner !== null) { socket.emit('bank_error', { message:'هذه البلد مش للبيع' }); return; }

        if (player.bankPaysNext) {
          delete player.bankPaysNext;
          delete player.halfRentNextLand;
          tile.owner = playerId;
          player.properties.push(tileId);
          io.to(`bank_${roomId}`).emit('bank_notification', {
            text: `🏦 البنك دفع ${tile.price} جنيه عن ${player.name} لشراء ${tile.name}`, type:'success',
          });
          completeResponseAndAdvance(game, io, roomId, playerId);
          return;
        }

        if (player.money < tile.price) { socket.emit('bank_error', { message:'معكش فلوس كافية' }); return; }
        player.money -= tile.price;
        tile.owner = playerId;
        player.properties.push(tileId);
        io.to(`bank_${roomId}`).emit('bank_notification', {
          text: `🏙️ ${player.name} اشترى ${tile.name} بـ ${tile.price} جنيه`, type:'success',
        });
        completeResponseAndAdvance(game, io, roomId, playerId);
      } catch (err) {
        socket.emit('bank_error', { message:'حدث خطأ أثناء الشراء' });
      }
    });

    // ✅ جديد: عندما يرفض اللاعب شراء بلد أو يغلق نافذة العرض
    socket.on('bank_dismiss_offer', ({ roomId, playerId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;

        // لا ننقل الدور إلا لو كان هذا اللاعب هو المسؤول عن العرض المعلق، والعرض ليس بطاقة
        if (game.awaitingResponseFrom === playerId &&
            (game.awaitingResponseKind === 'buy' ||
             game.awaitingResponseKind === 'rent' ||
             game.awaitingResponseKind === 'club')) {
          game.awaitingResponseFrom = null;
          game.awaitingResponseKind = null;
          advanceTurnAndBroadcast(game, io, roomId);
        }
      } catch (err) {
        console.error('❌ bank_dismiss_offer error:', err);
      }
    });

    socket.on('bank_build', ({ roomId, playerId, tileId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        if (game.phase !== 'playing' || game.gameOver) {
          socket.emit('bank_error', { message: 'اللعبة مش في مرحلة اللعب' });
          return;
        }
        const player = game.players.find(p=>p.id===playerId);
        const tile   = game.board.find(t=>t.id===tileId);

        if (!player || !tile || tile.owner !== player.id) {
          socket.emit('bank_error', { message:'هذه البلد مش ملكك' }); return;
        }
        if (tile.type !== 'land') {
          socket.emit('bank_error', { message:'البناء على البلاد بس' }); return;
        }
        if (tile.buildingLevel >= 3) {
          socket.emit('bank_error', { message:'البلد وصلت لأقصى مستوى' }); return;
        }
        if (tile.isMortgaged) {
          socket.emit('bank_error', { message:'البلد مرهونة' }); return;
        }

        const sameColorTiles = game.board.filter(t => t.color === tile.color && t.type === 'land');
        const ownsAll = sameColorTiles.every(t => t.owner === playerId);
        if (!ownsAll) {
          const missing = sameColorTiles
            .filter(t => t.owner !== playerId)
            .map(t => t.name)
            .join('، ');
          socket.emit('bank_error', {
            message: `لازم تملك كل بلاد اللون عشان تبني! ناقصك: ${missing}`
          });
          return;
        }

        const costs = [0, 50, 100, 200];
        const cost = costs[tile.buildingLevel + 1];
        if (player.money < cost) {
          socket.emit('bank_error', { message:`معكش فلوس كافية (محتاج ${cost})` }); return;
        }

        player.money -= cost;
        tile.buildingLevel += 1;

        const multipliers = { 0: 1, 1: 2, 2: 4, 3: 8 };
        sameColorTiles.forEach(t => {
          const level = t.buildingLevel || 0;
          const mult = multipliers[level] || 1;
          const orig = t._originalBaseRent ?? t.baseRent;
          t.baseRent = orig * mult;
        });

        const buildNames = ['','استراحة 🏕️','جراج 🏗️','سوق 🏪'];
        io.to(`bank_${roomId}`).emit('bank_notification', {
          text: `🏗️ ${player.name} بنى ${buildNames[tile.buildingLevel]} على ${tile.name} — ارتفع إيجار كل بلاد نفس اللون`,
          type: 'success',
        });
        broadcastGameState(io, roomId);
      } catch (err) {
        console.error('❌ bank_build error:', err);
        socket.emit('bank_error', { message:'حدث خطأ أثناء البناء' });
      }
    });

    socket.on('bank_leave_jail', ({ roomId, playerId, payFine }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game   = room.game;
        const player = game.players.find(p=>p.id===playerId);
        if (!player?.inJail) { socket.emit('bank_error', { message:'أنت لست في السجن' }); return; }

        if (payFine) {
          if (player.money < 50) { socket.emit('bank_error', { message:'ما معكش ٥٠ جنيه' }); return; }
          player.money -= 50;
          player.inJail = false;
          player.jailRollNeeded = null;
          player.jailTurns = 0;
          player.jailFromCard = false;
          io.to(`bank_${roomId}`).emit('bank_notification', {
            text:`🔓 ${player.name} دفع ٥٠ جنيه وخرج من السجن`, type:'success',
          });
        } else if (player.getOutOfJailCards > 0) {
          player.getOutOfJailCards -= 1;
          player.inJail = false;
          player.jailRollNeeded = null;
          player.jailTurns = 0;
          player.jailFromCard = false;
          io.to(`bank_${roomId}`).emit('bank_notification', {
            text:`🔓 ${player.name} استخدم بطاقة الخروج من السجن`, type:'success',
          });
        } else {
          socket.emit('bank_error', { message:'ليس لديك بطاقة ولا فلوس للدفع' }); return;
        }
        broadcastGameState(io, roomId);
      } catch (err) { socket.emit('bank_error', { message:'حدث خطأ' }); }
    });

    socket.on('bank_sell_property', ({ roomId, playerId, tileId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        const player = game.players.find(p=>p.id===playerId);
        const tile   = game.board.find(t=>t.id===tileId);
        if (!player || !tile || tile.owner !== player.id) {
          socket.emit('bank_error', { message:'هذا العقار ليس ملكك' }); return;
        }
        const price = Math.floor(tile.price * 0.8);
        player.money += price;
        tile.owner = null; tile.buildingLevel = 0; tile.isMortgaged = false;
        player.properties = player.properties.filter(id=>id!==tileId);
        io.to(`bank_${roomId}`).emit('bank_notification', {
          text:`💰 ${player.name} باع ${tile.name} بـ ${price} جنيه`, type:'warning',
        });
        broadcastGameState(io, roomId);
      } catch (err) { socket.emit('bank_error', { message:'حدث خطأ أثناء البيع' }); }
    });

    socket.on('bank_mortgage', ({ roomId, playerId, tileId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        const player = game.players.find(p=>p.id===playerId);
        const tile   = game.board.find(t=>t.id===tileId);
        if (!player || !tile || tile.owner !== player.id || tile.isMortgaged) {
          socket.emit('bank_error', { message:'لا يمكن الرهن' }); return;
        }
        const amt = Math.floor(tile.price * 0.5);
        player.money += amt;
        tile.isMortgaged = true;
        io.to(`bank_${roomId}`).emit('bank_notification', {
          text:`🔒 ${player.name} رهن ${tile.name} بـ ${amt} جنيه`, type:'warning',
        });
        broadcastGameState(io, roomId);
      } catch (err) { socket.emit('bank_error', { message:'حدث خطأ أثناء الرهن' }); }
    });

    socket.on('bank_unmortgage', ({ roomId, playerId, tileId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        const player = game.players.find(p=>p.id===playerId);
        const tile   = game.board.find(t=>t.id===tileId);
        if (!player || !tile || tile.owner !== player.id || !tile.isMortgaged) {
          socket.emit('bank_error', { message:'لا يمكن فك الرهن' }); return;
        }
        const cost = tile.price <= 250 ? 35 : 50;
        if (player.money < cost) { socket.emit('bank_error', { message:'معكش فلوس كافية لفك الرهن' }); return; }
        player.money -= cost;
        tile.isMortgaged = false;
        io.to(`bank_${roomId}`).emit('bank_notification', {
          text:`🔓 ${player.name} فك رهن ${tile.name} بـ ${cost} جنيه`, type:'success',
        });
        broadcastGameState(io, roomId);
      } catch (err) { socket.emit('bank_error', { message:'حدث خطأ' }); }
    });

    socket.on('bank_manual_pay', ({ roomId, fromId, toId, amount }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        const from = game.players.find(p=>p.id===fromId);
        if (!from || from.eliminated) { socket.emit('bank_error', { message:'اللاعب غير موجود' }); return; }
        const amt = parseInt(amount, 10);
        if (!amt || amt <= 0) { socket.emit('bank_error', { message:'مبلغ غير صحيح' }); return; }
        if (from.money < amt) {
          socket.emit('bank_error', { message:`ما معكش كفاية! عندك ${from.money} جنيه بس` }); return;
        }
        from.money -= amt;
        let toName = 'البنك';
        if (toId !== 'bank') {
          const to = game.players.find(p=>p.id===toId);
          if (to && !to.eliminated) { to.money += amt; toName = to.name; }
        }
        io.to(`bank_${roomId}`).emit('bank_notification', {
          text:`💸 ${from.name} دفع ${amt} جنيه لـ ${toName}`, type:'info',
        });
        broadcastGameState(io, roomId);
      } catch (err) { socket.emit('bank_error', { message:'حدث خطأ أثناء الدفع' }); }
    });

    socket.on('bank_shuffle_cards', ({ roomId, type }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        if (type === 'chance')         game.chanceDeck    = shuffleDeck(CHANCE_CARDS);
        else if (type === 'community') game.communityDeck = shuffleDeck(COMMUNITY_CARDS);
        else {
          game.chanceDeck    = shuffleDeck(CHANCE_CARDS);
          game.communityDeck = shuffleDeck(COMMUNITY_CARDS);
        }
        io.to(`bank_${roomId}`).emit('bank_notification', {
          text:`🔀 تم خلط كروت ${type==='chance'?'الحظ':type==='community'?'المحاكمة':'اللعبة'}`,
          type:'success',
        });
        broadcastGameState(io, roomId);
      } catch (err) { console.error('❌ bank_shuffle_cards error:', err); }
    });

    socket.on('bank_dismiss_card', ({ roomId, playerId }) => {
      io.to(`bank_${roomId}`).emit('bank_card_dismissed', { drawerId: playerId });
      const game = bankGames[roomId]?.game;
      if (!game) return;

      // ✅ إذا كانت البطاقة غير تفاعلية وكان هذا اللاعب هو المسؤول عن العرض المعلق → أنجز الدور
      if (game.awaitingResponseFrom === playerId && game.awaitingResponseKind === 'card') {
        game.awaitingResponseFrom = null;
        game.awaitingResponseKind = null;
        advanceTurnAndBroadcast(game, io, roomId);
      } else {
        // بطاقة تفاعلية → لا ننقل الدور، ننتظر bank_card_action
        broadcastGameState(io, roomId);
      }
    });

    socket.on('bank_card_action', ({ roomId, playerId, action, data }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game   = room.game;
        const player = game.players.find(p => p.id === playerId);
        if (!player) return;

        switch (action) {
          case 'take_city': {
            const tile = game.board.find(t => t.name === data.cityName && t.owner === null);
            if (!tile) { socket.emit('bank_error', { message:'المدينة دي مش متاحة' }); return; }
            tile.owner = playerId;
            player.properties.push(tile.id);
            io.to(`bank_${roomId}`).emit('bank_notification', {
              text:`🏙️ ${player.name} أخذ ${tile.name} مجاناً`, type:'success',
            });
            break;
          }
          case 'take_money': {
            player.money += data.amount;
            io.to(`bank_${roomId}`).emit('bank_notification', {
              text:`💰 ${player.name} أخذ ${data.amount} جنيه من البنك`, type:'success',
            });
            break;
          }
          case 'pay_fine': {
            if (player.money < data.amount) {
              socket.emit('bank_error', { message:'ما معكش كفاية' }); return;
            }
            player.money -= data.amount;
            io.to(`bank_${roomId}`).emit('bank_notification', {
              text:`💸 ${player.name} دفع ${data.amount} جنيه`, type:'warning',
            });
            break;
          }
          case 'go_to_jail_choice': {
            player.inJail = true;
            player.position = 24;
            player.jailFromCard = false;
            player.jailRollNeeded = data.jailRollNeeded;
            player.jailTurns = 0;
            io.to(`bank_${roomId}`).emit('bank_notification', {
              text:`⛓️ ${player.name} اختار السجن — محتاج يجيب ${data.jailRollNeeded} للخروج`,
              type:'error',
            });
            break;
          }
          case 'move_to_chosen_city': {
            const tile = game.board.find(t => t.name === data.cityName);
            if (tile) {
              if (tile.id < player.position) player.money += 200;
              player.position = tile.id;
            }
            player.money += data.amount;
            io.to(`bank_${roomId}`).emit('bank_notification', {
              text:`✈️ ${player.name} انتقل لـ${data.cityName} وأخذ ${data.amount} جنيه`, type:'success',
            });
            break;
          }
          default: break;
        }

        io.to(`bank_${roomId}`).emit('bank_card_dismissed', { drawerId: playerId });

        // ✅ بعد تنفيذ التفاعل → أنجز الدور إن كان هذا اللاعب مسؤول عن العرض المعلق
        if (game.awaitingResponseFrom === playerId) {
          game.awaitingResponseFrom = null;
          game.awaitingResponseKind = null;
          advanceTurnAndBroadcast(game, io, roomId);
        } else {
          broadcastGameState(io, roomId);
        }
      } catch(err) {
        console.error('❌ bank_card_action error:', err);
        socket.emit('bank_error', { message:'حدث خطأ' });
      }
    });

    socket.on('bank_pay_rent', ({ roomId, playerId, tileId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game   = room.game;
        const player = game.players.find(p=>p.id===playerId);
        const tile   = game.board.find(t=>t.id===tileId);
        if (!player || !tile) return;

        let rent;
        if (tile.type === 'club') {
          rent = Math.floor(tile.price * 0.1);
        } else {
          rent = tile.baseRent;
        }

        if (player.halfRentNextLand) {
          rent = Math.floor(rent / 2);
          io.to(`bank_${roomId}`).emit('bank_notification', {
            text: `✂️ ${player.name} دفع نصف الإيجار بسبب الكارت`, type:'info',
          });
        }

        if (player.bankPaysNext) {
          delete player.bankPaysNext;
          delete player.halfRentNextLand;

          if (tile.type === 'club') {
            const owners = (tile.owners||[]).filter(id => id !== playerId);
            if (owners.length === 0) {
              io.to(`bank_${roomId}`).emit('bank_notification', {
                text:`🎰 البنك دفع ${rent} جنيه للنادي — أنت الشريك الوحيد`, type:'warning',
              });
            } else {
              const perOwner = Math.floor(rent / owners.length);
              owners.forEach(ownerId => {
                const owner = game.players.find(p=>p.id===ownerId);
                if (owner) owner.money += perOwner;
              });
              io.to(`bank_${roomId}`).emit('bank_notification', {
                text:`🎰 البنك دفع ${rent} جنيه إيجار النادي (${perOwner} لكل مالك)`, type:'success',
              });
            }
          } else {
            const owner = game.players.find(p=>p.id===tile.owner);
            if (owner) owner.money += rent;
            io.to(`bank_${roomId}`).emit('bank_notification', {
              text:`🏦 البنك دفع ${rent} جنيه إيجار عن ${player.name} لـ ${owner?.name || 'المالك'}`, type:'success',
            });
          }

          completeResponseAndAdvance(game, io, roomId, playerId);
          return;
        }

        if (player.money < rent) {
          socket.emit('bank_error', { message:`ما معكش كفاية! الإيجار ${rent} جنيه` }); return;
        }

        const pay = Math.min(rent, player.money);
        player.money -= pay;

        if (tile.type === 'club') {
          const owners = (tile.owners||[]).filter(id => id !== playerId);
          const perOwner = Math.floor(pay / owners.length);
          owners.forEach(ownerId => {
            const owner = game.players.find(p=>p.id===ownerId);
            if (owner) owner.money += perOwner;
          });
          io.to(`bank_${roomId}`).emit('bank_notification', {
            text:`🎰 ${player.name} دفع إيجار ${pay} جنيه للنادي`, type:'warning',
          });
        } else {
          const owner = game.players.find(p=>p.id===tile.owner);
          if (owner) owner.money += pay;
          io.to(`bank_${roomId}`).emit('bank_notification', {
            text:`🏙️ ${player.name} دفع إيجار ${pay} جنيه لـ ${owner?.name||'المالك'} (${tile.name})`, type:'warning',
          });
        }

        delete player.halfRentNextLand;

        completeResponseAndAdvance(game, io, roomId, playerId);
      } catch(err) { socket.emit('bank_error', { message:'حدث خطأ أثناء دفع الإيجار' }); }
    });

    socket.on('bank_declare_bankruptcy', ({ roomId, playerId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        const player = game.players.find(p=>p.id===playerId);
        if (!player || player.eliminated) return;

        player.properties.forEach(id => {
          const tile = game.board.find(t=>t.id===id);
          if (tile) { tile.owner=null; tile.buildingLevel=0; tile.isMortgaged=false; }
        });
        player.properties = [];
        player.money = 0;
        player.eliminated = true;

        // لو كان هو المسؤول عن عرض معلق → امسحه
        if (game.awaitingResponseFrom === playerId) {
          game.awaitingResponseFrom = null;
          game.awaitingResponseKind = null;
        }

        io.to(`bank_${roomId}`).emit('bank_notification', {
          text:`💔 ${player.name} أعلن إفلاسه وخرج من اللعبة!`,
          type:'error',
        });

        const active = game.players.filter(p=>!p.eliminated);
        if (active.length === 1) {
          game.gameOver = true;
          game.winner = active[0].id;
          io.to(`bank_${roomId}`).emit('bank_game_over', { winnerId: active[0].id });
          broadcastGameState(io, roomId);
        } else if (active.length === 0) {
          game.gameOver = true;
          broadcastGameState(io, roomId);
        } else {
          if (game.turnOrder[game.currentTurnIndex] === playerId) {
            advanceTurnAndBroadcast(game, io, roomId);
            return;
          }
          broadcastGameState(io, roomId);
        }
      } catch (err) { console.error('❌ bank_declare_bankruptcy error:', err); }
    });

    socket.on('bank_get_state', ({ roomId }) => {
      broadcastGameState(io, roomId);
    });

    socket.on('bank_auction_start', ({ roomId, playerId, tileId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        if (game.phase !== 'playing' || game.gameOver) {
          socket.emit('bank_error', { message: 'اللعبة مش في مرحلة اللعب' });
          return;
        }
        const tile = game.board.find(t => t.id === tileId);
        const seller = game.players.find(p => p.id === playerId);
        if (!tile || tile.owner !== playerId) {
          socket.emit('bank_error', { message:'هذه البلد مش ملكك' }); return;
        }
        if (!bankGames[roomId].auctions) bankGames[roomId].auctions = {};
        bankGames[roomId].auctions[tileId] = { tile, sellerId:playerId, bids:{}, timeLeft:30 };

        io.to(`bank_${roomId}`).emit('bank_auction_start', { tile, duration:30 });
        io.to(`bank_${roomId}`).emit('bank_notification', {
          text:`🔨 ${seller?.name||'لاعب'} بدأ مزاد على ${tile.name}!`, type:'warning',
        });

        let timeLeft = 30;
        const tick = setInterval(() => {
          timeLeft--;
          io.to(`bank_${roomId}`).emit('bank_auction_tick', { timeLeft });
          if (timeLeft <= 0) {
            clearInterval(tick);
            const auc = bankGames[roomId]?.auctions?.[tileId];
            if (!auc) return;
            const bids = Object.entries(auc.bids);
            if (bids.length === 0) {
              io.to(`bank_${roomId}`).emit('bank_notification', {
                text:`❌ مزاد ${tile.name} انتهى بدون عروض`, type:'error',
              });
              delete bankGames[roomId].auctions[tileId];
              return;
            }
            const [winnerId, winAmount] = bids.sort((a,b)=>b[1]-a[1])[0];
            const winner = game.players.find(p=>p.id===winnerId);
            const sellerP = game.players.find(p=>p.id===playerId);
            if (!winner || winner.money < winAmount) {
              io.to(`bank_${roomId}`).emit('bank_notification', {
                text:`❌ الفايز ما معهوش فلوس كافية!`, type:'error',
              });
              delete bankGames[roomId].auctions[tileId];
              return;
            }
            winner.money -= winAmount;
            if (sellerP) sellerP.money += winAmount;
            tile.owner = winnerId;
            tile.buildingLevel = 0;
            if (sellerP) sellerP.properties = sellerP.properties.filter(id=>id!==tileId);
            if (!winner.properties.includes(tileId)) winner.properties.push(tileId);
            io.to(`bank_${roomId}`).emit('bank_auction_end', { winnerId, amount:winAmount, tileId });
            io.to(`bank_${roomId}`).emit('bank_notification', {
              text:`🔨 ${winner.name} اشترى ${tile.name} بـ ${winAmount} جنيه!`, type:'success',
            });
            delete bankGames[roomId].auctions[tileId];
            broadcastGameState(io, roomId);
          }
        }, 1000);
      } catch (err) {
        console.error('❌ bank_auction_start error:', err);
        socket.emit('bank_error', { message:'حدث خطأ في المزاد' });
      }
    });

    socket.on('bank_auction_bid', ({ roomId, playerId, amount }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.auctions) return;
        const auc = Object.values(room.auctions)[0];
        if (!auc) { socket.emit('bank_error', { message:'مفيش مزاد نشط' }); return; }
        const player = room.game?.players.find(p=>p.id===playerId);
        if (!player) return;
        const amt = parseInt(amount, 10);
        if (!amt || amt <= 0) { socket.emit('bank_error', { message:'مبلغ غير صحيح' }); return; }
        if (player.money < amt) {
          socket.emit('bank_error', { message:`ما معكش كفاية! عندك ${player.money} جنيه بس` }); return;
        }
        const maxBid = Math.max(0, ...Object.values(auc.bids));
        if (amt <= maxBid) {
          socket.emit('bank_error', { message:`لازم عرضك أعلى من ${maxBid} جنيه` }); return;
        }
        auc.bids[playerId] = amt;
        io.to(`bank_${roomId}`).emit('bank_auction_bid', { playerId, amount:amt });
      } catch (err) {
        socket.emit('bank_error', { message:'حدث خطأ في العرض' });
      }
    });

    socket.on('bank_payment_response', ({ roomId, reqId, playerId }) => {
      try {
        const room = bankGames[roomId];
        if (!room?.game) return;
        const game = room.game;
        const req = (game.pendingPayments || []).find(r => r.reqId === reqId && r.status === 'pending');
        if (!req) return;
        if (req.fromId !== playerId) return;

        const from = game.players.find(p => p.id === req.fromId);
        const to = game.players.find(p => p.id === req.toId);
        if (!from || !to) return;

        const actualAmount = Math.min(req.amount, from.money);
        from.money -= actualAmount;
        to.money   += actualAmount;
        req.status = 'paid';

        io.to(`bank_${roomId}`).emit('bank_notification', {
          text: `💸 ${from.name} دفع ${actualAmount} جنيه لـ ${to.name}`,
          type: 'info',
        });

        broadcastGameState(io, roomId);
      } catch (err) {
        console.error('❌ bank_payment_response error:', err);
      }
    });

    function handleLeave(socket) {
      let foundRoomId = null;
      let leavingPlayer = null;

      for (const [rid, room] of Object.entries(bankGames)) {
        const p = room.players.find(pl => pl.socketId === socket.id);
        if (p) {
          foundRoomId = rid;
          leavingPlayer = p;
          break;
        }
      }

      if (!foundRoomId || !leavingPlayer) return;
      const room = bankGames[foundRoomId];

      if (room.adminSocketId === socket.id) {
        room.adminSocketId = null;
      }
      if (room.adminPlayerId === leavingPlayer.id) {
        room.adminPlayerId = null;
      }

      const playerId = leavingPlayer.id;

      room.players = room.players.filter(p => p.id !== playerId);

      if (room.game) {
        const gp = room.game.players.find(p => p.id === playerId);
        if (gp) gp.eliminated = true;

        // لو كان مسؤول عن عرض معلق → امسحه
        if (room.game.awaitingResponseFrom === playerId) {
          room.game.awaitingResponseFrom = null;
          room.game.awaitingResponseKind = null;
        }

        if (room.game.turnOrder && room.game.turnOrder[room.game.currentTurnIndex] === playerId) {
          advanceTurnAndBroadcast(room.game, io, foundRoomId);
        } else {
          broadcastGameState(io, foundRoomId);
        }

        io.to(`bank_${foundRoomId}`).emit('bank_notification', {
          text: `🚪 ${leavingPlayer.name} خرج من اللعبة`,
          type: 'warning',
        });
      }

      if (room.players.length === 0) {
        delete bankGames[foundRoomId];
        return;
      }

      broadcastGameState(io, foundRoomId);
    }

    socket.on('disconnect', () => {
      console.log(`🏦 BankElHaz: Client ${socket.id} disconnected`);
      handleLeave(socket);
    });

    socket.on('close_game', ({ roomCode }) => {
      const room = bankGames[roomCode];
      if (!room) return;
      if (room.auctions) {
        Object.values(room.auctions).forEach(() => {});
        room.auctions = {};
      }
      delete bankGames[roomCode];
    });
  });
};