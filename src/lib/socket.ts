import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle joining workspace rooms
    socket.on('join-workspace', (workspaceId: string) => {
      socket.join(`workspace-${workspaceId}`);
      console.log(`Client ${socket.id} joined workspace ${workspaceId}`);
    });

    // Handle joining user-specific rooms for notifications
    socket.on('join-user', (userId: string) => {
      socket.join(`user-${userId}`);
      console.log(`Client ${socket.id} joined user ${userId}`);
    });

    // Handle attendance updates
    socket.on('attendance-update', (data: {
      workspaceId: string;
      userId: string;
      action: 'punch-in' | 'punch-out';
      timestamp: string;
    }) => {
      // Broadcast attendance update to all clients in the workspace
      io.to(`workspace-${data.workspaceId}`).emit('attendance-updated', {
        userId: data.userId,
        action: data.action,
        timestamp: data.timestamp,
        message: `Employee ${data.action === 'punch-in' ? 'punched in' : 'punched out'} at ${new Date(data.timestamp).toLocaleTimeString()}`
      });
    });

    // Handle leave request updates
    socket.on('leave-request-update', (data: {
      workspaceId: string;
      userId: string;
      action: 'submitted' | 'approved' | 'rejected';
      leaveRequestId: string;
      timestamp: string;
      details?: any;
    }) => {
      // Broadcast to workspace for managers/admins
      io.to(`workspace-${data.workspaceId}`).emit('leave-request-updated', {
        userId: data.userId,
        action: data.action,
        leaveRequestId: data.leaveRequestId,
        timestamp: data.timestamp,
        message: `Leave request ${data.action} by employee`,
        details: data.details
      });

      // Send specific notification to the user who requested leave
      if (data.action === 'approved' || data.action === 'rejected') {
        io.to(`user-${data.userId}`).emit('leave-request-status-changed', {
          leaveRequestId: data.leaveRequestId,
          status: data.action,
          timestamp: data.timestamp,
          message: `Your leave request has been ${data.action}`,
          details: data.details
        });
      }
    });

    // Handle messages
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};