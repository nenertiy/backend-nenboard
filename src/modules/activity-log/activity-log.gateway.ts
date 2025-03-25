import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ProjectsService } from '../projects/projects.service';

@WebSocketGateway({ namespace: 'activity-log' })
export class ActivityLogGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly projectsService: ProjectsService) {}

  @SubscribeMessage('subscribeToProjects')
  async handleSubscription(client: Socket, userId: string) {
    try {
      const projects = await this.projectsService.findProjects(userId);
      if (!projects.length) {
        client.emit('noProjects', { message: 'No projects found' });
        client.disconnect();
        return;
      }
      const rooms = projects.map((project) => `project_${project.id}`);
      client.join(rooms);
    } catch (error) {
      client.emit('error', {
        message: 'Failed to fetch projects',
        error: error.message,
      });
    }
  }
}
