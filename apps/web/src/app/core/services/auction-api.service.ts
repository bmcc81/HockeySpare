import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuctionAdminView,
  AuctionCheckoutResult,
  AuctionPaymentVerification,
  AuctionPublicView,
  CreateAuctionInput,
  CreateAuctionItemInput,
  MyBidsView,
  PlaceBidInput,
  PlaceBidResult,
  UpdateAuctionInput,
  UpdateAuctionItemInput,
  UpdateItemFulfillmentInput,
} from '@hockeyspare/contracts';

@Injectable({ providedIn: 'root' })
export class AuctionApiService {
  private readonly http = inject(HttpClient);

  private base(tournamentId: string): string {
    return `/api/tournaments/${tournamentId}/auction`;
  }

  getPublic(tournamentId: string): Observable<AuctionPublicView> {
    return this.http.get<AuctionPublicView>(this.base(tournamentId));
  }

  getAdmin(tournamentId: string): Observable<AuctionAdminView> {
    return this.http.get<AuctionAdminView>(`${this.base(tournamentId)}/admin`);
  }

  createOrEnable(
    tournamentId: string,
    input: CreateAuctionInput,
  ): Observable<AuctionAdminView> {
    return this.http.post<AuctionAdminView>(this.base(tournamentId), input);
  }

  update(
    tournamentId: string,
    input: UpdateAuctionInput,
  ): Observable<AuctionAdminView> {
    return this.http.patch<AuctionAdminView>(this.base(tournamentId), input);
  }

  closeAuction(tournamentId: string): Observable<AuctionAdminView> {
    return this.http.post<AuctionAdminView>(
      `${this.base(tournamentId)}/close`,
      {},
    );
  }

  addItem(
    tournamentId: string,
    input: CreateAuctionItemInput,
  ): Observable<AuctionAdminView> {
    return this.http.post<AuctionAdminView>(
      `${this.base(tournamentId)}/items`,
      input,
    );
  }

  updateItem(
    tournamentId: string,
    itemId: string,
    input: UpdateAuctionItemInput,
  ): Observable<AuctionAdminView> {
    return this.http.patch<AuctionAdminView>(
      `${this.base(tournamentId)}/items/${itemId}`,
      input,
    );
  }

  deleteItem(
    tournamentId: string,
    itemId: string,
  ): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      `${this.base(tournamentId)}/items/${itemId}`,
    );
  }

  uploadItemImage(
    tournamentId: string,
    itemId: string,
    file: File,
  ): Observable<AuctionAdminView> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<AuctionAdminView>(
      `${this.base(tournamentId)}/items/${itemId}/image`,
      form,
    );
  }

  closeItem(
    tournamentId: string,
    itemId: string,
  ): Observable<AuctionAdminView> {
    return this.http.post<AuctionAdminView>(
      `${this.base(tournamentId)}/items/${itemId}/close`,
      {},
    );
  }

  updateFulfillment(
    tournamentId: string,
    itemId: string,
    input: UpdateItemFulfillmentInput,
  ): Observable<AuctionAdminView> {
    return this.http.patch<AuctionAdminView>(
      `${this.base(tournamentId)}/items/${itemId}/fulfillment`,
      input,
    );
  }

  voidBid(
    tournamentId: string,
    itemId: string,
    bidId: string,
  ): Observable<AuctionAdminView> {
    return this.http.delete<AuctionAdminView>(
      `${this.base(tournamentId)}/items/${itemId}/bids/${bidId}`,
    );
  }

  placeBid(
    tournamentId: string,
    itemId: string,
    input: PlaceBidInput,
  ): Observable<PlaceBidResult> {
    return this.http.post<PlaceBidResult>(
      `${this.base(tournamentId)}/items/${itemId}/bids`,
      input,
    );
  }

  getMyBids(tournamentId: string, token: string): Observable<MyBidsView> {
    const params = new HttpParams().set('token', token);
    return this.http.get<MyBidsView>(`${this.base(tournamentId)}/my-bids`, {
      params,
    });
  }

  startCheckout(
    tournamentId: string,
    token: string,
  ): Observable<AuctionCheckoutResult> {
    const params = new HttpParams().set('token', token);
    return this.http.post<AuctionCheckoutResult>(
      `${this.base(tournamentId)}/checkout`,
      {},
      { params },
    );
  }

  verifyCheckout(
    tournamentId: string,
    sessionId: string,
  ): Observable<AuctionPaymentVerification> {
    return this.http.get<AuctionPaymentVerification>(
      `${this.base(tournamentId)}/payments/verify/${sessionId}`,
    );
  }
}
