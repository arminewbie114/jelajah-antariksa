import { normalizeRoomCode } from './net-utils.js';

const TRYSTERO_URL='https://cdn.jsdelivr.net/npm/trystero@0.26.0/+esm';
const APP_ID='nusantara-space-explorer-v1';
const PUBLIC_ROOM='nusantara-public-v1';
const PRIVATE_ROOM_PREFIX='nusantara-room-v1-';

function sendSafe(action,data,options){
  try{
    const pending=action.send(data,options);
    if(pending&&typeof pending.catch==='function')pending.catch(()=>{});
  }catch{}
}

export async function startMultiplayer(options={}){
  let trystero;
  try{
    trystero=await import(TRYSTERO_URL);
  }catch(error){
    options.onError?.({fatal:true,error});
    return null;
  }

  const {joinRoom,selfId}=trystero;
  const roomCode=normalizeRoomCode(options.roomCode);
  const roomId=roomCode?PRIVATE_ROOM_PREFIX+roomCode:PUBLIC_ROOM;
  const turnConfig=Array.isArray(options.turnConfig)?options.turnConfig.filter(Boolean):[];
  const config={appId:APP_ID};
  if(roomCode)config.password='nse-room:'+roomCode;
  if(turnConfig.length)config.turnConfig=turnConfig;

  try{
    const room=joinRoom(config,roomId,{
      onJoinError:details=>options.onJoinError?.(details)
    });
    const shipAction=room.makeAction('ship');
    const worldAction=room.makeAction('world');
    const localState=()=>{
      try{ return options.getLocalState?.(); }catch{ return null; }
    };

    shipAction.onMessage=(data,{peerId})=>{
      if(data&&typeof data==='object')options.onState?.(peerId,data);
    };
    worldAction.onMessage=(data,{peerId})=>{
      if(data&&typeof data==='object')options.onWorld?.(peerId,data);
    };

    room.onPeerJoin=peerId=>{
      const state=localState();
      if(state)sendSafe(shipAction,state,{target:peerId});
      options.onPeerJoin?.(peerId);
    };
    room.onPeerLeave=peerId=>options.onPeerLeave?.(peerId);

    const getPeerIds=()=>{
      const peers=room.getPeers();
      return peers instanceof Map?[...peers.keys()]:Object.keys(peers||{});
    };

    return {
      selfId,
      roomId,
      roomCode,
      isPublic:!roomCode,
      usingTurn:turnConfig.length>0,
      sendState(){
        const state=localState();
        if(state)sendSafe(shipAction,state);
      },
      sendStateTo(peerId){
        const state=localState();
        if(state)sendSafe(shipAction,state,{target:peerId});
      },
      sendWorld(data,targetId){
        sendSafe(worldAction,data,targetId?{target:targetId}:undefined);
      },
      getPeerIds,
      getPeerCount(){
        return getPeerIds().length;
      },
      leave(){
        try{
          const pending=room.leave();
          if(pending&&typeof pending.catch==='function')pending.catch(()=>{});
        }catch{}
      }
    };
  }catch(error){
    options.onError?.({fatal:true,error});
    return null;
  }
}
