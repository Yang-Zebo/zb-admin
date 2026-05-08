import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { RedisService } from '../../redis/redis.service.js'

export interface JwtPayload {
  sub: number
  username: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] || 'default-secret',
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: JwtPayload) {
    const currentToken = req.headers.authorization?.replace('Bearer ', '') || ''
    const blacklistedToken = await this.redisService.get(`token:blacklist:${payload.sub}`)
    if (blacklistedToken && blacklistedToken === currentToken) {
      return null
    }
    return { userId: payload.sub, username: payload.username }
  }
}
