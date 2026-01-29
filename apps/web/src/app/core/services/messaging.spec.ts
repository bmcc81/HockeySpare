import { TestBed } from '@angular/core/testing';

import { Messaging } from './messaging';

describe('Messaging', () => {
  let service: Messaging;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Messaging);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
